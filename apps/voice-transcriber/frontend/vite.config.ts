import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/voice-ai/' : '/',

  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../../shared'),
    },
  },

  build: {
    outDir: path.resolve(__dirname, '../../../public/voice-ai'),
    emptyOutDir: true,
  },

  server: {
    port: 5175,
    strictPort: true,
  },
}))