import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: Number(process.env.PORT) || 5173, open: true },
  build: {
    rollupOptions: {
      // xlsx is an optional peer-dep loaded dynamically; externalize so build succeeds
      // without the package. When xlsx is installed it will be bundled normally.
      external: ['xlsx'],
    },
  },
})
