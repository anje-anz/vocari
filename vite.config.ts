import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    electron([
      {
        // Main process - output in dist-electron/main.js (CJS)
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                '@twurple/api',
                '@twurple/auth',
                '@twurple/chat',
                '@twurple/common',
                '@twurple/api-call',
                'ws',
                'bufferutil',
                'utf-8-validate',
              ],
              output: {
                entryFileNames: 'main.js',
                format: 'es',
              },
            },
          },
        },
      },
      {
        // Preload - output in dist-electron/preload.mjs (ESM)
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                entryFileNames: 'preload.mjs',
                format: 'esm', // <-- ESM puro, NIENTE require!
              },
            },
          },
        },
      },
    ]),
  ],
})
