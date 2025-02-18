import { JSONSchemaType } from 'ajv';
import { Action } from '@reduxjs/toolkit';

// Define the basic action type for the demo
interface DemoAction extends Action {
  type: 'INCREMENT' | 'DECREMENT' | 'SET_MESSAGE' | 'RESET_COUNTER';
  payload?: string | number;
}

export type { DemoAction };