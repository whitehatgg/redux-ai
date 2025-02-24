import type { Action } from '@reduxjs/toolkit';

/**
 * Helper type to extract payload type from an action
 */
export type ActionPayload<T extends Action> = T extends { payload: infer P } ? P : never;
