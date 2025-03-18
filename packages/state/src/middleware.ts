import type { Middleware, AnyAction } from '@reduxjs/toolkit';
import type { MessageIntent } from './machine';

interface PendingAction {
  type: string;
  resolve: () => void;
}

interface WorkflowMiddlewareOptions {
  debug?: boolean;
}

export class WorkflowMiddleware {
  private pendingActions: PendingAction[] = [];
  private debug: boolean;

  constructor(options: WorkflowMiddlewareOptions = {}) {
    this.debug = options.debug || false;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[WorkflowMiddleware]', ...args);
    }
  }

  isPending(actionType: string): boolean {
    return this.pendingActions.some(action => action.type === actionType);
  }

  waitForAction(actionType: string): Promise<void> {
    return new Promise(resolve => {
      this.pendingActions.push({ type: actionType, resolve });
    });
  }

  private resolveAction(actionType: string) {
    const index = this.pendingActions.findIndex(action => action.type === actionType);
    if (index !== -1) {
      const [action] = this.pendingActions.splice(index, 1);
      action.resolve();
    }
  }

  createMiddleware(): Middleware {
    return _store => next => (action: unknown) => {
      const workflowAction = action as AnyAction & { intent?: MessageIntent };

      // Log the action if debug is enabled
      this.log('Action received:', workflowAction.type);

      // Check if this action completes any pending actions
      this.resolveAction(workflowAction.type);

      // For workflow actions, wait for all pending actions to complete
      if (workflowAction.intent === 'workflow') {
        this.log('Workflow action detected, waiting for pending actions...');
        return Promise.all(
          this.pendingActions.map(pending => this.waitForAction(pending.type))
        ).then(() => {
          this.log('All pending actions completed');
          return next(workflowAction);
        });
      }

      return next(workflowAction);
    };
  }
}

export const createWorkflowMiddleware = (options?: WorkflowMiddlewareOptions): Middleware => {
  const middleware = new WorkflowMiddleware(options);
  return middleware.createMiddleware();
};