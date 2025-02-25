import * as path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { YN_LIBS } from '@yank-note/runtime-api'

// https://vitejs.dev/config/
export default defineConfig({
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
    rollupOptions: {
      external: id => {
        return Object.keys(YN_LIBS).includes(id) || id.includes('@gradio/client/dist/wrapper-')
      },
      output: {
        intro: 'const fetch = function (url, options) { return (window.__PLUGIN_AI_COPILOT_FETCH || window.fetch)(url, options) };',
        globals: {
          window: 'window',
          ...YN_LIBS,
        }
      }
    }
  },
})
