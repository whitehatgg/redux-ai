import type { Middleware, AnyAction } from '@reduxjs/toolkit';

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
  sideEffectTypes?: string[];
  sideEffectTimeout?: number;
}

export class WorkflowMiddleware {
  private pendingActions: PendingAction[] = [];
  private sideEffects: SideEffect[] = [];
  private sideEffectTimeout: number;
  private sideEffectTypes: Set<string>;

  constructor(options: WorkflowMiddlewareOptions = {}) {
    this.sideEffectTimeout = options.sideEffectTimeout || 5000;
    this.sideEffectTypes = new Set(options.sideEffectTypes || []);
  }

  private isSideEffect(action: AnyAction): boolean {
    return this.sideEffectTypes.has(action.type);
  }

  private registerSideEffect(id: string, actionType: string): void {
    this.sideEffects.push({ id, completed: false, action: actionType });
  }

  private completeSideEffect(id: string): void {
    const effect = this.sideEffects.find(e => e.id === id);
    if (effect) {
      effect.completed = true;
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
          reject(new Error(`Timeout waiting for action: ${actionType}`));
        }
      }, this.sideEffectTimeout);
    });
  }

  private checkPendingActions(actionType: string): void {
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
    return () => next => async (action: AnyAction) => {
      if (this.isSideEffect(action)) {
        const effectId = `${action.type}_${Date.now()}`;
        this.registerSideEffect(effectId, action.type);

        const result = await next(action);
        this.completeSideEffect(effectId);
        return result;
      }

      if (action.sideEffectId) {
        this.completeSideEffect(action.sideEffectId);
      }

      const pendingEffects = this.sideEffects.filter(effect => !effect.completed);
      if (pendingEffects.length > 0) {
        await Promise.all(
          pendingEffects.map(effect => this.waitForAction(effect.action))
        ).catch(() => {});
      }

      return next(action);
    };
  }
}

export const createWorkflowMiddleware = (options?: WorkflowMiddlewareOptions): Middleware => {
  const middleware = new WorkflowMiddleware(options);
  return middleware.createMiddleware();
};