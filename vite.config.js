import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin para remover Google Analytics no build do GitHub Pages
function conditionalGoogleAnalytics() {
  return {
    name: 'conditional-google-analytics',
    transformIndexHtml(html) {
      // Se for build para GitHub Pages, remover Google Analytics
      const isGitHubBuild = process.env.VITE_BASE_URL === '/ayamioja-ra/'
      
      if (isGitHubBuild) {
        // Remover todo o bloco do Google Analytics
        return html.replace(
          /<!-- Google tag \(gtag\.js\) -->[\s\S]*?gtag\('config', 'G-56TQJQCJM9'\);[\s\S]*?<\/script>/,
          '<!-- Google Analytics removido no build GitHub Pages -->'
        )
      }
      
      return html
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    conditionalGoogleAnalytics()
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
