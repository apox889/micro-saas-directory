import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createLogoApiMiddleware } from './server/apiMiddleware.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'tool-logo-backend-api',
      configureServer(server) {
        server.middlewares.use(createLogoApiMiddleware());
      }
    }
  ],
  server: {
    port: 3000,
    host: true,
    open: false
  }
});
