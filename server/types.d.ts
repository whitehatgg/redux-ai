// Type augmentation for Vite server options
import type { ServerOptions } from 'vite';

declare module 'vite' {
  interface ServerOptions {
    middlewareMode?: boolean;
    hmr?: {
      server?: any;
    };
    allowedHosts?: boolean | true | string[];
  }
}
