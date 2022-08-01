import * as path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { YN_LIBS, getExtensionBasePath } from '@yank-note/runtime-api'

const OUT_DIR = 'dist/'

// https://vitejs.dev/config/
export default defineConfig({
  base: path.join(getExtensionBasePath(process.env.npm_package_name), OUT_DIR).replace(/\\/g, '/'),
  plugins: [vue()],
  define: {
    __EXTENSION_VERSION__: JSON.stringify(process.env.npm_package_version),
    __EXTENSION_ID__: JSON.stringify(process.env.npm_package_name),
  },
  resolve: {
    alias: [
      { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
    ],
  },
  build: {
    minify: 'terser',
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      formats: ['iife'],
      name: process.env.npm_package_name.replace(/[^a-zA-Z0-9_]/g, '_'),
      fileName: () => 'index.js',
    },
    outDir: OUT_DIR,
    rollupOptions: {
      external: Object.keys(YN_LIBS),
      output: {
        globals: {
          window: 'window',
          ...YN_LIBS,
        }
      }
    }
  },
})
