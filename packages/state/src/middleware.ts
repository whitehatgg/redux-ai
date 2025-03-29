import type { Middleware, AnyAction, Dispatch } from '@reduxjs/toolkit';

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

// Track action types that typically indicate async operations
const asyncActionPatterns = [
  // Redux-observable epics
  /\/fulfilled$/,
  /\/rejected$/,
  /\/pending$/,
  // Redux-saga patterns 
  /\/request$/,
  /\/success$/,
  /\/failure$/,
  // Common naming patterns
  /start$/i,
  /begin$/i,
  /complete$/i,
  /success$/i,
  /failure$/i,
  /error$/i,
  /done$/i,
  /end$/i
];

/**
 * Options for the effect tracker middleware
 */
export interface EffectTrackerOptions {
  /**
   * Enable debug logging
   */
  debug?: boolean;
  
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Callback when effects are completed
   */
  onEffectsCompleted?: () => void;
}

/**
 * Creates a middleware that tracks asynchronous side effects from various sources:
 * - Redux Thunk
 * - RTK Query
 * - Redux Saga
 * - Promise Middleware
 * - Custom async actions
 */
export const createEffectTrackerMiddleware = (options: EffectTrackerOptions = {}) => {
  const { debug = false, timeout = 30000 } = options;
  
  /**
   * Track an effect with the given ID
   */
  const trackEffect = (effectId: string, promise: Promise<unknown>) => {
    if (debug) {
      console.log(`[EffectTracker] Tracking effect: ${effectId}`);
    }
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_resolve, reject) => {
      setTimeout(() => {
        pendingEffects.delete(effectId);
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
        if (debug) {
          console.log(`[EffectTracker] Effect completed: ${effectId}`);
        }
      });
    
    // Store the effect
    pendingEffects.set(effectId, trackedPromise);
    
    return trackedPromise;
  };
  
  /**
   * Wait for all pending effects to complete
   */
  const waitForEffects = async () => {
    if (pendingEffects.size === 0) {
      if (debug) {
        console.log('[EffectTracker] No pending effects to wait for');
      }
      return;
    }
    
    if (debug) {
      console.log(`[EffectTracker] Waiting for ${pendingEffects.size} effects to complete`);
      // Log effect IDs for debugging
      console.log(`[EffectTracker] Pending effects: ${Array.from(pendingEffects.keys()).join(', ')}`);
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
      console.log('[EffectTracker] All effects completed');
    }
    
    // Call the onEffectsCompleted callback if provided
    if (options.onEffectsCompleted) {
      options.onEffectsCompleted();
    }
  };
  
  // Map to track related action types by base type
  const relatedActionMap = new Map<string, string[]>();
  
  /**
   * Identifies the base action type from an async action sequence
   * Examples:
   * - "users/fetchUser/pending" -> "users/fetchUser"
   * - "FETCH_POSTS_REQUEST" -> "FETCH_POSTS"
   */
  const getBaseActionType = (actionType: string): string => {
    // Handle RTK Query style
    if (actionType.endsWith('/pending') || actionType.endsWith('/fulfilled') || actionType.endsWith('/rejected')) {
      return actionType.split('/').slice(0, -1).join('/');
    }
    
    // Handle Redux Saga style
    if (actionType.endsWith('_REQUEST') || actionType.endsWith('_SUCCESS') || actionType.endsWith('_FAILURE')) {
      return actionType.replace(/_(REQUEST|SUCCESS|FAILURE)$/, '');
    }
    
    // Handle other common patterns
    const suffixMatch = actionType.match(/(START|BEGIN|COMPLETE|SUCCESS|FAILURE|ERROR|DONE|END)$/i);
    if (suffixMatch) {
      return actionType.substring(0, actionType.length - suffixMatch[0].length);
    }
    
    return actionType;
  };
  
  /**
   * Determines if the action type represents the start of an async operation
   */
  const isStartAction = (actionType: string): boolean => {
    return actionType.endsWith('/pending') || 
           actionType.endsWith('_REQUEST') ||
           actionType.endsWith('START') ||
           actionType.endsWith('BEGIN') ||
           /start$/i.test(actionType) ||
           /begin$/i.test(actionType);
  };
  
  /**
   * Determines if the action type represents the end of an async operation
   */
  const isEndAction = (actionType: string): boolean => {
    return actionType.endsWith('/fulfilled') || 
           actionType.endsWith('/rejected') ||
           actionType.endsWith('_SUCCESS') ||
           actionType.endsWith('_FAILURE') ||
           actionType.endsWith('COMPLETE') ||
           actionType.endsWith('SUCCESS') ||
           actionType.endsWith('FAILURE') ||
           actionType.endsWith('ERROR') ||
           actionType.endsWith('DONE') ||
           actionType.endsWith('END') ||
           /complete$/i.test(actionType) ||
           /success$/i.test(actionType) ||
           /failure$/i.test(actionType) ||
           /error$/i.test(actionType) ||
           /done$/i.test(actionType) ||
           /end$/i.test(actionType);
  };
  
  // The actual middleware
  const middleware: Middleware = ({ dispatch, getState }) => next => (action: any) => {
    // Skip non-object actions
    if (!action || typeof action !== 'object') {
      return next(action);
    }
    
    // Extract the action type safely
    const actionType = action.type ? String(action.type) : 'unknown';
    
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
        const rtPromise = new Promise<void>((resolve) => {
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
              if (debug) {
                console.warn(`[EffectTracker] RTK effect timed out: ${requestId}`);
              }
              resolve();
              return;
            }
          }, 50);
        });
        
        trackEffect(effectId, rtPromise);
      } 
      // Clean up when the request completes
      else if (
        (actionType.endsWith('/fulfilled') || actionType.endsWith('/rejected')) && 
        trackedRequestIds.has(requestId)
      ) {
        trackedRequestIds.delete(requestId);
        const effectId = `rtk-${requestId}`;
        pendingEffects.delete(effectId);
      }
    }
    
    // 2. Promise middleware (promise in payload)
    if (
      action.payload && 
      typeof action.payload === 'object' && 
      typeof action.payload.then === 'function'
    ) {
      const effectId = `payload-${actionType}-${Date.now()}`;
      trackEffect(effectId, action.payload);
    }
    
    // 3. Saga effects or manually marked actions
    if (action.meta?._effect === true) {
      const sagaId = action.meta.effectId || `${actionType}-${Date.now()}`;
      const effectId = `saga-${sagaId}`;
      
      // If a saga action has an explicit promise, track it
      if (action.meta.promise && typeof action.meta.promise.then === 'function') {
        trackEffect(effectId, action.meta.promise);
      } 
      // Otherwise track via saga end action pattern
      else if (action.meta.isStart) {
        sagaEffectIds.add(sagaId);
        
        // Create promise that will resolve when saga completes
        const sagaPromise = new Promise<void>((resolve) => {
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
        
        trackEffect(effectId, sagaPromise);
      }
      // Handle saga completion
      else if (action.meta.isEnd && sagaEffectIds.has(sagaId)) {
        sagaEffectIds.delete(sagaId);
        pendingEffects.delete(`saga-${sagaId}`);
      }
    }
    
    // 4. Track conventional async action patterns by naming convention 
    // This handles redux-observable, redux-saga, and other libraries that follow naming conventions
    if (!action.meta?.requestId) { // Don't double track RTK actions
      const baseType = getBaseActionType(actionType);
      
      // If this is a start action, track it
      if (isStartAction(actionType)) {
        // Store this action pattern so we can match it later
        if (!relatedActionMap.has(baseType)) {
          relatedActionMap.set(baseType, []);
        }
        relatedActionMap.get(baseType)?.push(actionType);
        
        // Generate a unique ID for this pattern instance
        const timestamp = Date.now();
        const patternId = `pattern-${baseType}-${timestamp}`;
        
        // Store timestamp in the related actions map to help with cleanup
        if (!relatedActionMap.has(baseType)) {
          relatedActionMap.set(baseType, []);
        }
        
        // Add this timestamp to the list of pending operations for this base type
        relatedActionMap.get(baseType)?.push(timestamp.toString());
        
        // Create a promise that will resolve when a matching end action is dispatched
        const patternPromise = new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            // Check if this effect was cleaned up
            if (!pendingEffects.has(patternId)) {
              clearInterval(interval);
              resolve();
              return;
            }
            
            // Check for timeout
            if (Date.now() - timestamp > timeout) {
              clearInterval(interval);
              pendingEffects.delete(patternId);
              
              // Also remove from the related actions map
              const related = relatedActionMap.get(baseType);
              if (related) {
                const index = related.indexOf(timestamp.toString());
                if (index !== -1) {
                  related.splice(index, 1);
                }
              }
              
              if (debug) {
                console.warn(`[EffectTracker] Pattern effect timed out: ${baseType}`);
              }
              resolve();
              return;
            }
          }, 50);
        });
        
        if (debug) {
          console.log(`[EffectTracker] Tracking pattern start: ${actionType} (base: ${baseType})`);
        }
        
        trackEffect(patternId, patternPromise);
      } 
      // If this is an end action, clean up the matching start action
      else if (isEndAction(actionType)) {
        const timestamps = relatedActionMap.get(baseType);
        if (timestamps && timestamps.length > 0) {
          // Get the oldest timestamp to clean up (FIFO)
          const timestamp = timestamps.shift();
          
          if (timestamp) {
            const patternId = `pattern-${baseType}-${timestamp}`;
            
            if (debug) {
              console.log(`[EffectTracker] Pattern completed: ${actionType} (base: ${baseType})`);
            }
            
            // Clean up the effect
            pendingEffects.delete(patternId);
          }
        }
      }
    }
    
    // 5. Non-promise dependencies check (for actions that don't use promises directly, like epics or flow)
    if (action.meta?.deps && Array.isArray(action.meta.deps)) {
      for (const depId of action.meta.deps) {
        pendingEffects.delete(`dep-${depId}`);
      }
    }
    
    // Pass to next middleware and get result
    const result = next(action);
    
    // 6. Thunk middleware will return a promise
    if (result instanceof Promise) {
      const effectId = `thunk-${actionType}-${Date.now()}`;
      trackEffect(effectId, result);
    }
    
    // 7. Check for promise properties in arbitrary locations
    // Some libraries might put promises in different action properties
    if (action && typeof action === 'object') {
      for (const key of Object.keys(action)) {
        if (key !== 'type' && key !== 'payload' && action[key] && 
            typeof action[key] === 'object' && typeof action[key].then === 'function') {
          const effectId = `prop-${key}-${actionType}-${Date.now()}`;
          trackEffect(effectId, action[key]);
        }
      }
    }
    
    return result;
  };
  
  // Return the middleware with the waitForEffects and trackEffect methods attached
  return Object.assign(middleware, { 
    waitForEffects,
    trackEffect 
  });
};

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
  effects: []
};

/**
 * Creates an effect tracker with the given options
 */
export const createEffectTracker = (options: EffectTrackerOptions = {}): EffectTracker => {
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
            endTime: currentTime
          };
        }
        return effect;
      });
      
      // Log effects completed
      if (options.debug) {
        console.log('[EffectTracker] All effects completed, ready for next workflow step');
      }
    }
  });
  
  // Add trackEffect method to the middleware object
  const middlewareWithTrackEffect = middleware as Middleware & { 
    waitForEffects: () => Promise<void>;
    trackEffect: (effectId: string, promise: Promise<unknown>, type?: string) => Promise<unknown>;
  };
  
  // Define the trackEffect method if it doesn't exist
  if (!middlewareWithTrackEffect.trackEffect) {
    // Use the original internal trackEffect function from createEffectTrackerMiddleware scope
    const tracker = (id: string, p: Promise<unknown>) => {
      // Create a new promise that will resolve when the effect is complete
      return p.finally(() => {
        if (options.debug) {
          console.log(`[EffectTracker] Effect completed: ${id}`);
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
  middlewareWithTrackEffect.trackEffect = (effectId: string, promise: Promise<unknown>, type = 'unknown') => {
    // Update the side effect store
    const startTime = Date.now();
    sideEffectStore.pendingCount++;
    
    // Add to side effect store for tracking
    sideEffectStore.effects.push({
      id: effectId,
      type,
      status: 'pending',
      startTime
    });
    
    // Log for debugging
    if (options.debug) {
      console.log(`[EffectTracker] Adding side effect: ${effectId} of type ${type}`);
      console.log(`[EffectTracker] Current pending effects: ${sideEffectStore.pendingCount}`);
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
        console.log(`[EffectTracker] Completed side effect: ${effectId} of type ${type}`);
        console.log(`[EffectTracker] Remaining pending effects: ${sideEffectStore.pendingCount}`);
      }
    });
    
    // Call original trackEffect with the wrapped promise
    const result = originalTrackEffect(effectId, wrappedPromise);
    
    return result;
  };
  
  return {
    middleware: middlewareWithTrackEffect,
    waitForEffects: middlewareWithTrackEffect.waitForEffects,
    
    // Add a getter for the side effect store
    getSideEffectInfo: () => ({...sideEffectStore}),
    
    // Reset the side effect store
    resetSideEffectInfo: () => {
      sideEffectStore.pendingCount = 0;
      sideEffectStore.completedCount = 0;
      sideEffectStore.effects = [];
    }
  };
};

/**
 * Mark an action as having an asynchronous effect
 * 
 * Note: This will add non-serializable values (promises) to the action metadata.
 * While Redux generally warns against this practice, it's required for tracking
 * async operations. Consider setting `{ serializableCheck: false }` in your
 * middleware configuration if using this helper extensively.
 * 
 * @param action The Redux action to mark
 * @param options Options for the effect or a promise
 * @returns The action with effect metadata attached
 */
export function markAsEffect<T extends AnyAction>(
  action: T, 
  promise: Promise<unknown>
): T;

export function markAsEffect<T extends AnyAction>(
  action: T, 
  options: {
    promise?: Promise<unknown>;
    effectId?: string;
    isStart?: boolean;
    isEnd?: boolean;
  }
): T;

export function markAsEffect<T extends AnyAction>(
  action: T, 
  optionsOrPromise?: Promise<unknown> | {
    promise?: Promise<unknown>;
    effectId?: string;
    isStart?: boolean;
    isEnd?: boolean;
  }
): T {
  // If called with just a promise as second arg
  if (optionsOrPromise instanceof Promise) {
    return {
      ...action,
      meta: {
        ...action.meta,
        _effect: true,
        promise: optionsOrPromise
      }
    };
  }
  
  // Otherwise, use the options object
  return {
    ...action,
    meta: {
      ...action.meta,
      _effect: true,
      ...(optionsOrPromise || {})
    }
  };
};