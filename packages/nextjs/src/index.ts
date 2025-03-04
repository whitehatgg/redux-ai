import { BaseAdapter } from '@redux-ai/runtime';
import type { AdapterResponse, RuntimeAdapterConfig } from '@redux-ai/runtime/dist/types';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js adapter for Redux AI runtime
 */
export { NextjsAdapter } from './adapter';

// Re-export default adapter from the same module
export { NextjsAdapter as default } from './adapter';
