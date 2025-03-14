declare module 'vite' {
  import type { Server } from 'http';

  // Base configuration type
  interface BaseServerOptions {
    middlewareMode?: boolean;
    hmr?: {
      server?: Server;
    };
  }

  // Extended options with all possible allowedHosts configurations
  interface AllowedHostsConfig {
    // Allow any boolean value as well as string arrays
    allowedHosts?: any;  // Using any to bypass the type restriction while maintaining functionality
  }

  // Combine both types using intersection
  export type ServerOptions = BaseServerOptions & AllowedHostsConfig;

  export function defineConfig(config: any): any;
}

declare module 'vitest/config' {
  export interface UserConfigExport {
    plugins?: any[];
    resolve?: {
      alias?: Record<string, string>;
    };
    test?: {
      globals?: boolean;
      environment?: string;
      include?: string[];
      setupFiles?: string[];
      coverage?: {
        provider?: string;
        reporter?: string[];
        exclude?: string[];
      };
      deps?: {
        optimizer?: {
          web?: {
            include?: string[];
          };
        };
        inline?: string[];
      };
    };
    // Allow additional properties
    [key: string]: any;
  }

  export function defineConfig(config: UserConfigExport): UserConfigExport;
}