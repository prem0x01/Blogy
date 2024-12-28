import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // This is important for the WebSocket connection
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
    }
  }
})
