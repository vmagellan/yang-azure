import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure the correct MIME types
    rollupOptions: {
      output: {
        // Ensure JS files get the correct MIME type
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    // Add modulePreload settings for production only
    modulePreload: {
      polyfill: true,
    },
    // Generate manifest for production
    manifest: true,
    // Improve code splitting
    cssCodeSplit: true,
    // Ensure sourcemaps are readable
    sourcemap: true
  },
  server: {
    port: 5173, // Standard port - if you're using 5174, you might want to change this
    // Allow localhost connection with HTTPS
    https: false, // Set to true if using HTTPS in local dev
    headers: {
      // Set MIME types for local development as well
      'Content-Type': 'application/javascript; charset=utf-8',
    }
  }
})
