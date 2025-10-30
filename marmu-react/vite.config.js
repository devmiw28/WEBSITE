import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Use a different port than the Flask backend
    port: 5173,
    proxy: {
      // Proxy API calls to the Flask backend
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // Strip the /api prefix so frontend can call /api/... while backend serves ...
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
