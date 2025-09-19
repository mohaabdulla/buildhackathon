import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
  optimizeDeps: {
    exclude: ['sql.js'],
  },
  assetsInclude: ['**/*.wasm'],
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pixi: ['pixi.js'],
          sqlite: ['sql.js'],
          state: ['zustand'],
        },
      },
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  define: {
    global: 'globalThis',
  },
})
