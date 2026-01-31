import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  // BASE_URL: '/' para Hostinger, '/ayamioja-ra/' para GitHub Pages
  base: process.env.VITE_BASE_URL || '/',
  server: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild'
  },
  esbuild: {
    drop: ['console', 'debugger']
  },
  publicDir: 'public'
})
