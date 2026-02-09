import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensure relative paths for Apache subdirectories
  server: {
    proxy: {
      // Forward requests starting with /backend to the PHP server running on port 8000
      '/backend': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // 巨大なJSファイルを分割してキャッシュ効率を向上させる設定
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          'vendor-ui': ['lucide-react', 'recharts'],
          'vendor-utils': ['alasql', 'diff', 'dompurify', 'highlight.js', 'pdf-lib', 'pdfjs-dist']
        }
      }
    }
  }
})