import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(), // remova os colchetes
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,              // ✅ use essa porta
    watch: {
      usePolling: true       // ✅ essencial no Docker
    }
  }
})