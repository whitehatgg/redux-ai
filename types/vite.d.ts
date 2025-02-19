import type { ServerOptions as ViteServerOptions } from 'vite';
import type { Server as HttpServer } from 'http';

declare module 'vite' {
  interface ServerOptions extends ViteServerOptions {
    middlewareMode?: boolean | { server: HttpServer };
    hmr?: boolean | {
      server?: HttpServer;
    };
  }
}