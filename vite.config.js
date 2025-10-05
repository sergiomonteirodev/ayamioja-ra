import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ghPages from 'vite-plugin-gh-pages'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ghPages({
      branch: 'gh-pages',
      repo: 'https://github.com/SEU_USUARIO/ayamioja-ra.git', // Substitua pelo seu repositório
      user: {
        name: 'SEU_NOME', // Substitua pelo seu nome
        email: 'SEU_EMAIL@example.com' // Substitua pelo seu email
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
