import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v3': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
