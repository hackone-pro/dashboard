import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(), // remova os colchetes
  ],
  server: {
    host: '0.0.0.0',
    port: 5174,              // ✅ evita conflito com Vite do Strapi admin (5173)
    watch: {
      usePolling: true       // ✅ essencial no Docker
    }
  }
})