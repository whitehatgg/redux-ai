import type { Middleware, AnyAction } from '@reduxjs/toolkit';
import type { MessageIntent } from './machine';

interface PendingAction {
  type: string;
  resolve: () => void;
  timestamp: number;
}

interface SideEffect {
  id: string;
  completed: boolean;
  action: string;
}

interface WorkflowMiddlewareOptions {
  debug?: boolean;
  sideEffectTimeout?: number;
  sideEffectTypes?: string[]; // Action types that represent side effects
}

export class WorkflowMiddleware {
  private pendingActions: PendingAction[] = [];
  private sideEffects: SideEffect[] = [];
  private debug: boolean;
  private sideEffectTimeout: number;
  private sideEffectTypes: Set<string>;

  constructor(options: WorkflowMiddlewareOptions = {}) {
    this.debug = options.debug || false;
    this.sideEffectTimeout = options.sideEffectTimeout || 5000;
    this.sideEffectTypes = new Set(options.sideEffectTypes || []);
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[WorkflowMiddleware]', ...args);
    }
  }

  private isSideEffect(action: AnyAction): boolean {
    return this.sideEffectTypes.has(action.type);
  }

  private registerSideEffect(id: string, actionType: string): void {
    this.sideEffects.push({ id, completed: false, action: actionType });
    this.log('Registered side effect:', id, 'for action:', actionType);
  }

  private completeSideEffect(id: string): void {
    const effect = this.sideEffects.find(e => e.id === id);
    if (effect) {
      effect.completed = true;
      this.log('Completed side effect:', id);
      this.checkPendingActions(effect.action);
    }
  }

  private waitForAction(actionType: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      this.pendingActions.push({ type: actionType, resolve, timestamp });

      setTimeout(() => {
        const index = this.pendingActions.findIndex(a => 
          a.type === actionType && a.timestamp === timestamp
        );
        if (index !== -1) {
          this.pendingActions.splice(index, 1);
          const timeoutError = new Error(`Timeout waiting for action: ${actionType}`);
          console.error('Side effect timeout:', {
            action: actionType,
            timeout: this.sideEffectTimeout,
            error: timeoutError.message
          });
          reject(timeoutError);
        }
      }, this.sideEffectTimeout);
    });
  }

  private checkPendingActions(actionType: string) {
    const now = Date.now();
    const actionsToResolve = this.pendingActions.filter(action => 
      action.type === actionType && 
      now - action.timestamp < this.sideEffectTimeout
    );

    actionsToResolve.forEach(action => {
      const index = this.pendingActions.indexOf(action);
      if (index !== -1) {
        this.pendingActions.splice(index, 1);
        action.resolve();
      }
    });
  }

  createMiddleware(): Middleware {
    return _store => next => async (action: unknown) => {
      const workflowAction = action as AnyAction & { 
        intent?: MessageIntent;
        sideEffectId?: string;
      };

      this.log('Action received:', workflowAction.type);

      // Track side effects
      if (this.isSideEffect(workflowAction)) {
        const effectId = `${workflowAction.type}_${Date.now()}`;
        this.registerSideEffect(effectId, workflowAction.type);

        // Let the action flow through
        const result = await next(workflowAction);

        // Mark as completed
        this.completeSideEffect(effectId);
        return result;
      }

      // Handle workflow side effects
      if (workflowAction.sideEffectId) {
        this.completeSideEffect(workflowAction.sideEffectId);
      }

      // For workflow actions, ensure all side effects are completed
      if (workflowAction.intent === 'workflow') {
        this.log('Workflow action detected, checking side effects...');
        try {
          const pendingPromises = this.sideEffects
            .filter(effect => !effect.completed)
            .map(effect => this.waitForAction(effect.action));

          if (pendingPromises.length > 0) {
            this.log('Waiting for pending side effects...');
            await Promise.all(pendingPromises).catch(error => {
              console.error('Error waiting for side effects:', {
                error: error.message,
                pendingSideEffects: this.sideEffects
                  .filter(effect => !effect.completed)
                  .map(effect => effect.action)
              });
            });
            this.log('All side effects completed or timed out');
          }
        } catch (error) {
          console.error('Unexpected error in workflow processing:', error);
        }
      }

      // Check if this action completes any pending actions
      this.checkPendingActions(workflowAction.type);

      return next(workflowAction);
    };
  }
}

export const createWorkflowMiddleware = (options?: WorkflowMiddlewareOptions): Middleware => {
  const middleware = new WorkflowMiddleware(options);
  return middleware.createMiddleware();
};