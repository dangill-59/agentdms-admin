import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and React DOM in a separate chunk
          'react-vendor': ['react', 'react-dom'],
          // React Router in a separate chunk
          'router': ['react-router-dom'],
          // Other vendor libraries
          'vendor': ['axios', 'yet-another-react-lightbox']
        }
      }
    },
    // Increase chunk size warning limit slightly to accommodate optimized chunks
    chunkSizeWarningLimit: 600
  }
})
