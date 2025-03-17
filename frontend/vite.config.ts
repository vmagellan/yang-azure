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
    // Add modulePreload settings
    modulePreload: {
      polyfill: true,
    },
    // Generate manifest
    manifest: true,
    // Improve code splitting
    cssCodeSplit: true,
    // Ensure sourcemaps are readable
    sourcemap: true
  },
  server: {
    port: 5173, // Ensure this matches the port in Entra ID configuration
    // Allow localhost connection with HTTPS
    https: false, // Set to true if using HTTPS in local dev
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Content-Type': 'application/javascript; charset=utf-8'
    }
  }
})
