import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  server: {
    host: true, // Allow external connections
    port: 5173, // Explicit port
    allowedHosts: [
      'localhost',
      '.ngrok.io',
      '.ngrok-free.app',
      '.ngrok.app',
    ],
    cors: true, // Enable CORS for all origins in development
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
  },
  base: './', // Use relative paths for better deployment compatibility
})
