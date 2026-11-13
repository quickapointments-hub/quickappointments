import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyConfig = {
  target: 'http://127.0.0.1:4000',
  changeOrigin: true,
  secure: false,
  configure: (proxy: any) => {
    proxy.on('error', (_err: any, _req: any, res: any) => {
      if (!res.headersSent) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            code: 'BACKEND_OFFLINE',
            message:
              'The Quick Appointments Backend API (port 4000) is offline or unreachable. Please start the backend server with: npm run start:backend or npm run dev',
          })
        );
      }
    });
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': apiProxyConfig,
    },
  },
  preview: {
    port: 3000,
    host: true,
    proxy: {
      '/api': apiProxyConfig,
    },
  },
});

