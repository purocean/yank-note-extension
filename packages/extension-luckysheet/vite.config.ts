import * as path from 'path'
import { defineConfig } from 'vite'
import fs from 'fs-extra'
import vue from '@vitejs/plugin-vue'
import { YN_LIBS, getExtensionBasePath } from '@yank-note/runtime-api'

// copy lucky-sheet
const luckySheetDist = path.resolve(__dirname, 'luckysheet')
if (!fs.existsSync(path.join(luckySheetDist, 'luckysheet.umd.js'))) {
  fs.copySync(
    path.resolve(__dirname, 'node_modules/luckysheet/dist'),
    luckySheetDist,
    {
      filter: src => {
        if (src.includes('demoData') || src.includes('esm.js') || src.includes('index.html') || src.endsWith('.map')) {
          return false
        }

        return true
      }
    }
  )
  const jsFile = path.join(luckySheetDist, 'luckysheet.umd.js')
  const js = fs.readFileSync(jsFile, 'utf8')
  const baseUrl = getExtensionBasePath(process.env.npm_package_name)
  fs.writeFileSync(jsFile, js.replace(/expendPlugins\/chart/g, `${baseUrl}/luckysheet/expendPlugins/chart`))
}

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
