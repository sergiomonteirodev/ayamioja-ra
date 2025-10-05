import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ghPages } from 'vite-plugin-gh-pages'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ghPages({
      branch: 'gh-pages',
      repo: 'https://github.com/sergiomonteirodev/ayamioja-ra.git',
      user: {
        name: 'sergiomonteirodev',
        email: 'sergio@example.com'
      }
    })
  ],
  base: '/ayamioja-ra/', // Substitua pelo nome do seu repositório
  server: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
