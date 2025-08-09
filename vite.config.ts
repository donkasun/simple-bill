import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Removed COOP/COEP headers to allow loading cross-origin resources like CDN scripts during development
})
