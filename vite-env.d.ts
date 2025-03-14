/// <reference types="vite/client" />

declare module 'vite' {
  import type { Server } from 'http';

  interface ServerOptions {
    middlewareMode?: boolean;
    hmr?: {
      server?: Server;
    };
    // Allow any boolean value for allowedHosts
    allowedHosts?: boolean | string[] | undefined;
  }

  export interface UserConfigExport {
    plugins?: any[];
    resolve?: {
      alias?: Record<string, string>;
    };
    root?: string;
    build?: {
      outDir?: string;
      emptyOutDir?: boolean;
      lib?: {
        entry?: string | string[] | Record<string, string>;
        name?: string;
        formats?: ('es' | 'cjs' | 'umd' | 'iife')[];
        fileName?: string | ((format: string) => string);
      };
      target?: string | string[];
      sourcemap?: boolean | 'inline' | 'hidden';
      minify?: boolean | 'terser' | 'esbuild';
      cssCodeSplit?: boolean;
      rollupOptions?: any;
    };
    server?: ServerOptions;
    configFile?: boolean | string;
    appType?: string;
    customLogger?: {
      info: (msg: string, options?: any) => void;
      warn: (msg: string, options?: any) => void;
      error: (msg: string, options?: any) => void;
    };
  }

  export function defineConfig(config: UserConfigExport): UserConfigExport;
  export function createLogger(): {
    info: (msg: string, options?: any) => void;
    warn: (msg: string, options?: any) => void;
    error: (msg: string, options?: any) => void;
  };
  export function createServer(config: UserConfigExport): Promise<{
    middlewares: any;
    transformIndexHtml: (url: string, html: string) => Promise<string>;
    ssrFixStacktrace: (e: Error) => void;
  }>;
}