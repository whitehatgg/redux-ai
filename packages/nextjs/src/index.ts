import { BaseAdapter } from '@redux-ai/runtime';
import type { AdapterResponse, RuntimeAdapterConfig } from '@redux-ai/runtime/dist/types';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js adapter for Redux AI runtime
 */
export { NextjsAdapter } from './adapter';
export type { AdapterResponse, RuntimeAdapterConfig };

// Default export
export { NextjsAdapter as default } from './adapter';