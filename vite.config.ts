import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function spa404Fallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      try {
        const outDir = path.resolve(import.meta.dirname || '.', 'dist');
        const indexPath = path.join(outDir, 'index.html');
        const fallbackPath = path.join(outDir, '404.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fallbackPath);
        }
      } catch (err) {
        console.warn('Could not generate 404.html fallback:', err);
      }
    },
  };
}

function appleShopApiMock(): Plugin {
  return {
    name: 'apple-shop-api-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url.startsWith('/shop/api') || req.url.includes('digital-mat') || req.url.startsWith('/shop/mdp') || req.url.startsWith('/shop/dc'))) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            status: 'success',
            digitalMat: {},
            body: {},
            header: 'iPhone',
            items: [],
            footnotes: {},
            errorMessage: null,
            financingExampleBootstrap: {},
            representativeExampleBootstrap: {}
          }));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [appleShopApiMock(), react(), tailwindcss(), spa404Fallback()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
