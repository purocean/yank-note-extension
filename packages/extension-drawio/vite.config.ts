import * as path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { YN_LIBS } from '@yank-note/runtime-api'
import copy from 'rollup-plugin-copy'
import * as fs from 'fs'

if (!fs.existsSync(path.resolve(__dirname, 'drawio/src/main/webapp/index.html'))) {
  throw new Error('Drawio not found')
}

export default ({ mode }) => defineConfig({
  plugins: [vue(), copy({
    targets: [
      { src: 'src/index.html', dest: 'editor' },
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
    outDir: mode,
    lib: {
      entry: {
        [mode]: path.resolve(__dirname, `src/${mode}.ts`),
      },
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
        },
      },
    }
  },
})
