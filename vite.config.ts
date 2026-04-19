import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v3': {
        target: 'https://external-api.quickli.com.au',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
