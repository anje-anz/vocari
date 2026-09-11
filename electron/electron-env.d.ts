/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
export {};

declare global {
  interface Window {
    ipcRenderer: {
      send(channel: string, ...args: unknown[]): void;
      on(channel: string, listener: (...args: unknown[]) => void): void;
      off(channel: string, listener: (...args: unknown[]) => void): void;
      invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    };
    windowControls: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  }
}