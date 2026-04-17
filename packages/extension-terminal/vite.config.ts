import * as path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const YN_LIBS = {
  vue: 'ctx.lib.vue',
  semver: 'ctx.lib.semver',
  dayjs: 'ctx.lib.dayjs',
  'crypto-js': 'ctx.lib.cryptojs',
  turndown: 'ctx.lib.turndown',
  juice: 'ctx.lib.juice',
  sortablejs: 'ctx.lib.sortablejs',
  'filenamify/browser': 'ctx.lib.filenamify',
  mime: 'ctx.lib.mime',
  'markdown-it': 'ctx.lib.markdownit',
  'dom-to-image': 'ctx.lib.domtoimage',
  pako: 'ctx.lib.pako',
}

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
    },
  },
})
