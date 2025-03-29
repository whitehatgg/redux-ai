import type { Middleware } from '@reduxjs/toolkit';

/**
 * Effect tracking state is global in order to ensure that effects are tracked
 * across multiple instances of the middleware. This is useful when the middleware
 * is used in different parts of the application or in different stores.
 */

// Collection of pending async effects
const pendingEffects = new Map<string, Promise<unknown>>();

// Track request IDs to avoid duplicates
const trackedRequestIds = new Set<string>();

// Track saga tasks (via meta flag)
const sagaEffectIds = new Set<string>();

/**
 * Options for the effect tracker middleware
 */
export interface EffectTrackerOptions {
  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Timeout in milliseconds for effects
   */
  timeout?: number;

  /**
   * Delay in milliseconds to group related actions
   * Actions dispatched within this time window after the initial action
   * will be considered part of the same group
   */
  groupingDelay?: number;

  /**
   * Callback when effects are completed
   */
  onEffectsCompleted?: () => void;
}

/**
 * Action group tracker to monitor related actions dispatched in a time window
 */
interface ActionGroup {
  initialActionType: string;
  startTime: number;
  actions: Array<{
    type: string;
    timestamp: number;
  }>;
  pendingEffectIds: Set<string>;
  groupId: string;
}

/**
 * Interface for the Effect Tracker
 */
export interface EffectTracker {
  /**
   * The Redux middleware
   */
  middleware: Middleware;

  /**
   * Wait for all pending effects to complete
   */
  waitForEffects: () => Promise<void>;

  /**
   * Wait for all action groups to complete
   * This is useful to wait for all related actions within a time window
   */
  waitForActionGroups?: () => Promise<void>;

  /**
   * Get information about side effects
   */
  getSideEffectInfo: () => SideEffectInfo;

  /**
   * Reset the side effect info
   */
  resetSideEffectInfo: () => void;
}

/**
 * Interface for tracking side effects
 */
export interface SideEffectInfo {
  pendingCount: number;
  completedCount: number;
  effects: Array<{
    id: string;
    type: string;
    status: 'pending' | 'completed' | 'timeout';
    startTime: number;
    endTime?: number;
  }>;
}

// Storage for side effects - can be used by activity log
const sideEffectStore: SideEffectInfo = {
  pendingCount: 0,
  completedCount: 0,
  effects: [],
};

/**
 * Creates a middleware that tracks asynchronous side effects from various sources:
 * - Redux Thunk
 * - RTK Query
 * - Redux Saga
 * - Promise Middleware
 * - Custom async actions
 *
 * This implementation uses time-based action grouping rather than pattern matching
 */
const createEffectTrackerMiddleware = (options: EffectTrackerOptions = {}) => {
  const {
    debug = false,
    timeout = 30000,
    groupingDelay = 500, // Default 500ms window to group related actions
  } = options;

  // Active action groups being tracked
  const activeActionGroups = new Map<string, ActionGroup>();

  // Last action timestamp to track action sequences
  let lastActionTimestamp = 0;
  let currentActionGroup: ActionGroup | null = null;

  /**
   * Track an effect with the given ID
   */
  const trackEffect = (effectId: string, promise: Promise<unknown>, actionGroup?: ActionGroup) => {
    if (debug) {
      console.debug(`[EffectTracker] Tracking effect: ${effectId}`);
    }

    // Create a timeout promise
    const timeoutPromise = new Promise(_resolve => {
      setTimeout(() => {
        pendingEffects.delete(effectId);

        // If this effect belongs to an action group, remove it from there too
        if (actionGroup) {
          actionGroup.pendingEffectIds.delete(effectId);
        }

        if (debug) {
          console.warn(`[EffectTracker] Effect timed out after ${timeout}ms: ${effectId}`);
        }
      }, timeout);
    });

    // Create a promise that completes when either the original promise resolves or times out
    const trackedPromise = Promise.race([promise, timeoutPromise])
      .catch(error => {
        // We catch but don't rethrow to prevent uncaught promise rejections
        // Just log the error
        if (debug) {
          console.error(`[EffectTracker] Effect error: ${effectId}`, error);
        }
      })
      .finally(() => {
        pendingEffects.delete(effectId);

        // If this effect belongs to an action group, remove it from there too
        if (actionGroup) {
          actionGroup.pendingEffectIds.delete(effectId);

          // If the action group has no more pending effects, clean it up
          if (actionGroup.pendingEffectIds.size === 0) {
            activeActionGroups.delete(actionGroup.groupId);
            if (debug) {
              console.debug(`[EffectTracker] Action group completed: ${actionGroup.groupId}`);
            }
          }
        }

        if (debug) {
          console.debug(`[EffectTracker] Effect completed: ${effectId}`);
        }
      });

    // Store the effect
    pendingEffects.set(effectId, trackedPromise);

    // Add to action group if provided
    if (actionGroup) {
      actionGroup.pendingEffectIds.add(effectId);
    }

    return trackedPromise;
  };

  /**
   * Wait for all pending effects to complete
   */
  const waitForEffects = async () => {
    if (pendingEffects.size === 0) {
      if (debug) {
        console.debug('[EffectTracker] No pending effects to wait for');
      }
      return;
    }

    if (debug) {
      console.debug(`[EffectTracker] Waiting for ${pendingEffects.size} effects to complete`);
      // Log effect IDs for debugging
      console.debug(
        `[EffectTracker] Pending effects: ${Array.from(pendingEffects.keys()).join(', ')}`
      );
    }

    // Wait for all pending effects to complete
    try {
      await Promise.all(Array.from(pendingEffects.values()));
    } catch (error) {
      // Log but continue - we don't want to throw here
      if (debug) {
        console.error('[EffectTracker] Error while waiting for effects:', error);
      }
    }

    if (debug) {
      console.debug('[EffectTracker] All effects completed');
    }

    // Call the onEffectsCompleted callback if provided
    if (options.onEffectsCompleted) {
      options.onEffectsCompleted();
    }
  };

  /**
   * Create a new action group or add to existing group based on timing
   */
  const addToActionGroup = (action: any): ActionGroup => {
    const now = Date.now();
    const actionType = action.type ? String(action.type) : 'unknown';

    // Check if we should create a new action group or use the current one
    if (!currentActionGroup || now - lastActionTimestamp > groupingDelay) {
      // Create a new action group
      const groupId = `group-${actionType}-${now}`;
      const newGroup: ActionGroup = {
        initialActionType: actionType,
        startTime: now,
        actions: [
          {
            type: actionType,
            timestamp: now,
          },
        ],
        pendingEffectIds: new Set<string>(),
        groupId,
      };

      // Store the group
      activeActionGroups.set(groupId, newGroup);
      currentActionGroup = newGroup;

      if (debug) {
        console.debug(`[EffectTracker] Created new action group: ${groupId}`);
      }
    } else {
      // Add to existing group
      currentActionGroup.actions.push({
        type: actionType,
        timestamp: now,
      });

      if (debug) {
        console.debug(
          `[EffectTracker] Added action to group ${currentActionGroup.groupId}: ${actionType}`
        );
      }
    }

    // Update last action timestamp
    lastActionTimestamp = now;

    return currentActionGroup;
  };

  /**
   * Wait for effects in all action groups to complete
   */
  const waitForActionGroups = async () => {
    if (activeActionGroups.size === 0) {
      if (debug) {
        console.debug('[EffectTracker] No action groups to wait for');
      }
      return;
    }

    if (debug) {
      console.debug(
        `[EffectTracker] Waiting for ${activeActionGroups.size} action groups to complete`
      );

      // Log action group details for debugging
      for (const group of activeActionGroups.values()) {
        console.debug(
          `[EffectTracker] Group: ${group.groupId}, Initial action: ${group.initialActionType}, ` +
            `Actions: ${group.actions.length}, Pending effects: ${group.pendingEffectIds.size}`
        );
      }
    }

    // Create a promise for each action group
    const groupPromises = Array.from(activeActionGroups.values()).map(group => {
      return new Promise<void>(resolve => {
        // Create polling interval to check if group is completed
        const interval = setInterval(() => {
          // If the group has no more pending effects or is no longer active, resolve
          if (group.pendingEffectIds.size === 0 || !activeActionGroups.has(group.groupId)) {
            clearInterval(interval);
            resolve();
            return;
          }
        }, 50);

        // Safety timeout to prevent hanging
        setTimeout(() => {
          clearInterval(interval);
          if (debug) {
            console.warn(`[EffectTracker] Action group timed out: ${group.groupId}`);
          }
          resolve();
        }, timeout);
      });
    });

    // Wait for all group promises to complete
    await Promise.all(groupPromises);

    if (debug) {
      console.debug('[EffectTracker] All action groups completed');
    }
  };

  // The actual middleware
  const middleware: Middleware = () => next => (action: any) => {
    // Skip non-object actions
    if (!action || typeof action !== 'object') {
      return next(action);
    }

    // Extract the action type safely
    const actionType = action.type ? String(action.type) : 'unknown';

    // Add action to a group (either existing or new)
    const actionGroup = addToActionGroup(action);

    // Handle several types of async patterns:

    // 1. RTK Query and createAsyncThunk (they follow a standard pattern with meta.requestId)
    if (action.meta?.requestId) {
      const requestId = action.meta.requestId;

      // Only track each request once
      if (actionType.endsWith('/pending') && !trackedRequestIds.has(requestId)) {
        trackedRequestIds.add(requestId);

        const effectId = `rtk-${requestId}`;
        const startTime = Date.now();

        // Create a promise that will resolve when the fulfilled/rejected action arrives
        const rtPromise = new Promise<void>(resolve => {
          // Use a polling interval - in a real implementation would use store.subscribe
          const interval = setInterval(() => {
            // Check if this effect was cleaned up
            if (!pendingEffects.has(effectId)) {
              clearInterval(interval);
              resolve();
              return;
            }

            // Check for timeout
            if (Date.now() - startTime > timeout) {
              clearInterval(interval);
              pendingEffects.delete(effectId);

              // Remove from action group too
              actionGroup.pendingEffectIds.delete(effectId);

              if (debug) {
                console.warn(`[EffectTracker] RTK effect timed out: ${requestId}`);
              }
              resolve();
              return;
            }
          }, 50);
        });

        trackEffect(effectId, rtPromise, actionGroup);
      }
      // Clean up when the request completes
      else if (
        (actionType.endsWith('/fulfilled') || actionType.endsWith('/rejected')) &&
        trackedRequestIds.has(requestId)
      ) {
        trackedRequestIds.delete(requestId);
        const effectId = `rtk-${requestId}`;
        pendingEffects.delete(effectId);

        // Remove from any action groups
        for (const group of activeActionGroups.values()) {
          group.pendingEffectIds.delete(effectId);
        }
      }
    }

    // 2. Promise middleware (promise in payload)
    if (
      action.payload &&
      typeof action.payload === 'object' &&
      typeof action.payload.then === 'function'
    ) {
      const effectId = `payload-${actionType}-${Date.now()}`;
      trackEffect(effectId, action.payload, actionGroup);
    }

    // 3. Saga effects or manually marked actions
    if (action.meta?._effect === true) {
      const sagaId = action.meta.effectId || `${actionType}-${Date.now()}`;
      const effectId = `saga-${sagaId}`;

      // If a saga action has an explicit promise, track it
      if (action.meta.promise && typeof action.meta.promise.then === 'function') {
        trackEffect(effectId, action.meta.promise, actionGroup);
      }
      // Otherwise track via saga end action pattern
      else if (action.meta.isStart) {
        sagaEffectIds.add(sagaId);

        // Create promise that will resolve when saga completes
        const sagaPromise = new Promise<void>(resolve => {
          // This interval checks if the saga has completed
          const interval = setInterval(() => {
            if (!sagaEffectIds.has(sagaId)) {
              clearInterval(interval);
              resolve();
              return;
            }
          }, 50);

          // Safety cleanup
          setTimeout(() => {
            clearInterval(interval);
            if (sagaEffectIds.has(sagaId)) {
              sagaEffectIds.delete(sagaId);
              if (debug) {
                console.warn(`[EffectTracker] Saga effect timed out: ${sagaId}`);
              }
            }
            resolve();
          }, timeout);
        });

        trackEffect(effectId, sagaPromise, actionGroup);
      }
      // Handle saga completion
      else if (action.meta.isEnd && sagaEffectIds.has(sagaId)) {
        sagaEffectIds.delete(sagaId);
        pendingEffects.delete(`saga-${sagaId}`);

        // Remove from any action groups
        for (const group of activeActionGroups.values()) {
          group.pendingEffectIds.delete(`saga-${sagaId}`);
        }
      }
    }

    // Pass to next middleware and get result
    const result = next(action);

    // 4. Thunk middleware will return a promise
    if (result instanceof Promise) {
      const effectId = `thunk-${actionType}-${Date.now()}`;
      trackEffect(effectId, result, actionGroup);
    }

    // 5. Check for promise properties in arbitrary locations
    // Some libraries might put promises in different action properties
    if (action && typeof action === 'object') {
      for (const key of Object.keys(action)) {
        if (
          key !== 'type' &&
          key !== 'payload' &&
          action[key] &&
          typeof action[key] === 'object' &&
          typeof action[key].then === 'function'
        ) {
          const effectId = `prop-${key}-${actionType}-${Date.now()}`;
          trackEffect(effectId, action[key], actionGroup);
        }
      }
    }

    return result;
  };

  // Return the middleware with the waitForEffects and trackEffect methods attached
  return Object.assign(middleware, {
    waitForEffects,
    trackEffect,
    waitForActionGroups,
  });
};

/**
 * Creates a Redux AI middleware for tracking asynchronous effects
 */
export const createReduxAIMiddleware = (options: EffectTrackerOptions = {}): EffectTracker => {
  const middleware = createEffectTrackerMiddleware({
    ...options,
    onEffectsCompleted: () => {
      if (options.onEffectsCompleted) {
        options.onEffectsCompleted();
      }

      // Update side effects store
      const currentTime = Date.now();
      sideEffectStore.effects = sideEffectStore.effects.map(effect => {
        if (effect.status === 'pending') {
          return {
            ...effect,
            status: 'completed',
            endTime: currentTime,
          };
        }
        return effect;
      });

      // Log effects completed
      if (options.debug) {
        console.debug('[EffectTracker] All effects completed, ready for next workflow step');
      }
    },
  });

  // Add trackEffect method to the middleware object
  const middlewareWithTrackEffect = middleware as Middleware & {
    waitForEffects: () => Promise<void>;
    waitForActionGroups: () => Promise<void>;
    trackEffect: (effectId: string, promise: Promise<unknown>, type?: string) => Promise<unknown>;
  };

  // Define the trackEffect method if it doesn't exist
  if (!middlewareWithTrackEffect.trackEffect) {
    // Use the original internal trackEffect function from createEffectTrackerMiddleware scope
    const tracker = (id: string, p: Promise<unknown>) => {
      // Create a new promise that will resolve when the effect is complete
      return p.finally(() => {
        if (options.debug) {
          console.debug(`[EffectTracker] Effect completed: ${id}`);
        }
      });
    };

    middlewareWithTrackEffect.trackEffect = (effectId: string, promise: Promise<unknown>) => {
      return tracker(effectId, promise);
    };
  }

  // Save the original trackEffect method
  const originalTrackEffect = middlewareWithTrackEffect.trackEffect;

  // Override trackEffect to record details in the side effect store
  middlewareWithTrackEffect.trackEffect = (
    effectId: string,
    promise: Promise<unknown>,
    type = 'unknown'
  ) => {
    // Update the side effect store
    const startTime = Date.now();
    sideEffectStore.pendingCount++;

    // Add to side effect store for tracking
    sideEffectStore.effects.push({
      id: effectId,
      type,
      status: 'pending',
      startTime,
    });

    // Log for debugging
    if (options.debug) {
      console.debug(`[EffectTracker] Adding side effect: ${effectId} of type ${type}`);
      console.debug(`[EffectTracker] Current pending effects: ${sideEffectStore.pendingCount}`);
    }

    // Ensure promise is a real promise
    const safePromise = Promise.resolve(promise);

    // Create a wrapping promise to track completion
    const wrappedPromise = safePromise.finally(() => {
      // Find the effect in the store
      const effectIndex = sideEffectStore.effects.findIndex(e => e.id === effectId);
      if (effectIndex >= 0) {
        // Update the effect
        sideEffectStore.effects[effectIndex].status = 'completed';
        sideEffectStore.effects[effectIndex].endTime = Date.now();
      }

      // Update counters
      sideEffectStore.pendingCount = Math.max(0, sideEffectStore.pendingCount - 1);
      sideEffectStore.completedCount++;

      if (options.debug) {
        console.debug(`[EffectTracker] Completed side effect: ${effectId} of type ${type}`);
        console.debug(`[EffectTracker] Remaining pending effects: ${sideEffectStore.pendingCount}`);
      }
    });

    // Call original trackEffect with the wrapped promise
    const result = originalTrackEffect(effectId, wrappedPromise);

    return result;
  };

  return {
    middleware: middlewareWithTrackEffect,
    waitForEffects: middlewareWithTrackEffect.waitForEffects,
    waitForActionGroups: middlewareWithTrackEffect.waitForActionGroups,

    // Add a getter for the side effect store
    getSideEffectInfo: () => ({ ...sideEffectStore }),

    // Reset the side effect store
    resetSideEffectInfo: () => {
      sideEffectStore.pendingCount = 0;
      sideEffectStore.completedCount = 0;
      sideEffectStore.effects = [];
    },
  };
};

// The markAsEffect function has been removed.
// The middleware now automatically detects and tracks asynchronous effects
// without requiring manual marking of effects.

// createEffectTracker is no longer available - use createReduxAIMiddleware instead
