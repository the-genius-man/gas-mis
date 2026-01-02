import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isElectron = process.env.ELECTRON === 'true';

  return {
    plugins: [
      react(),
      ...(isElectron ? [
        electron([
          {
            entry: 'electron/main.js',
          },
          {
            entry: 'electron/preload.js',
            onstart(options) {
              options.reload();
            },
          },
        ]),
        renderer(),
      ] : []),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    base: isElectron ? './' : '/',
  };
});
