declare module 'vite' {
  export interface ServerOptions {
    middlewareMode?: boolean;
    hmr?: {
      server?: any;
    };
    // Define allowedHosts to accept boolean literal true
    allowedHosts?: true | string[] | undefined;
  }
  export function defineConfig(config: any): any;
}

declare module 'vitest/config' {
  // Augment the existing UserConfigExport interface
  import type { UserConfigExport as VitestConfigExport } from 'vitest';
  export interface UserConfigExport extends VitestConfigExport {
    // Add any missing properties that your configs use
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