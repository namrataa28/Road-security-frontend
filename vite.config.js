import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy disabled - using direct API calls to deployed backend via VITE_API_BASE_URL
    // If you want to test with local backend, uncomment the proxy below and set VITE_API_BASE_URL=http://localhost:5000
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5000',
    //     changeOrigin: true,
    //     secure: false,
    //   }
    // }
  }
})
