import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: [],
    exclude: [...configDefaults.exclude],
  },
  // Removed COOP/COEP headers to allow loading cross-origin resources like CDN scripts during development
})
