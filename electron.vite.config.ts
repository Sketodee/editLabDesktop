import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@/lib': resolve('src/main/lib'),
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    assetsInclude: 'src/renderer/assets/**',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        // '@/hooks': resolve('src/renderer/src/hooks'),
        '@/assets': resolve('src/renderer/src/assets'),
        '@/context': resolve('src/renderer/src/context'),
        '@/components': resolve('src/renderer/src/components'),
        '@/utils': resolve('src/renderer/src/utils'),
        '@/types': resolve('src/renderer/src/types'),
        '@/pages': resolve('src/renderer/src/pages')
        // '@/mocks': resolve('src/renderer/src/mocks')
      }
    },
    plugins: [react()]
  }
})
