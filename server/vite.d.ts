declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: true | string[] | undefined;
  }
}
