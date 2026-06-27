import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

function glbHotReload(): Plugin {
  return {
    name: 'glb-hmr',
    configureServer(server) {
      server.watcher.add('public/models/*.glb');
      server.watcher.add('public/models/manifest.json');
      server.watcher.on('change', (path) => {
        if (path.endsWith('.glb') || path.endsWith('manifest.json')) {
          server.ws.send({ type: 'full-reload', path });
        }
      });
    },
  };
}

export default defineConfig({
  root: '.',
  base: '/cciv/',
  publicDir: 'public',
  plugins: [glbHotReload()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
});
