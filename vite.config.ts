import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Absolute, not './'. Relative asset URLs resolve against the current
    // path, so on a two-level route like /admin/products or /product/<id> the
    // browser asked for /admin/assets/index.js, got a 404 and rendered
    // nothing. The app is served from the domain root.
    base: '/',
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // Only what every visitor needs anyway. Naming a chunk here puts it
          // in the entry's preload set, so listing recharts, jspdf and xlsx
          // made the browser fetch 720 KB of admin-only libraries on the
          // homepage. They are left to the automatic per-route splitting.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          },
        },
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
