import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'

export default defineConfig({
  plugins: [
    react(),
    mdx({ jsxImportSource: 'react' })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'public',
    emptyOutDir: false, // Don't delete existing static files in public
  },
  publicDir: 'static' // Use a different folder for static assets
})
