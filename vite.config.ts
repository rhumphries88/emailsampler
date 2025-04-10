import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://primary-production-166e.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false
      }
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    },
    headers: {
      // Set proper MIME types for JavaScript modules
      'Content-Type': 'application/javascript'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    // Add .js extensions for proper module resolution
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  }
});