import * as path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import copy from 'rollup-plugin-copy'
import { YN_LIBS } from '@yank-note/runtime-api'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), copy({
    targets: [
      { src: 'node_modules/markmap-lib/dist/browser/index.iife.js', dest: 'dist', rename: 'markmap-lib.iife.js' },
      { src: 'node_modules/markmap-view/dist/browser/index.js', dest: 'dist', rename: 'markmap-view.js' },
      { src: 'node_modules/markmap-toolbar/dist/index.js', dest: 'dist', rename: 'markmap-toolbar.js' },
      { src: 'node_modules/markmap-toolbar/dist/style.css', dest: 'dist', rename: 'markmap-toolbar.css' },
      { src: 'node_modules/d3/dist/d3.min.js', dest: 'dist' },
    ],
    hook: 'writeBundle',
  })],
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
      name: process.env.npm_package_name!.replace(/[^a-zA-Z0-9_]/g, '_'),
      fileName: () => 'index.js',
    },
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
