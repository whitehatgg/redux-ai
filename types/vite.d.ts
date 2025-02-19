import type { ServerOptions as ViteServerOptions } from 'vite';

declare module 'vite' {
  interface ServerOptions extends ViteServerOptions {
    middlewareMode?: boolean | { server: HttpServer };
    hmr?: boolean | {
      server?: any;
    };
  }
}