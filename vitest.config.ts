import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/engine': resolve(__dirname, './src/engine'),
      '@/data': resolve(__dirname, './src/data'),
      '@/systems': resolve(__dirname, './src/systems'),
      '@/ui': resolve(__dirname, './src/ui'),
      '@/scenes': resolve(__dirname, './src/scenes'),
      '@/render': resolve(__dirname, './src/render'),
      '@/workers': resolve(__dirname, './src/workers'),
      '@/utils': resolve(__dirname, './src/utils'),
    },
  },
})
