import * as path from 'path'
import JSZip from 'jszip'
import * as fs from 'fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { YN_LIBS } from '@yank-note/runtime-api'
import copy from 'rollup-plugin-copy'

const __EXTENSION_ID__ = process.env.npm_package_name!

const exLibs: any = { ...YN_LIBS }
delete exLibs.vue

function replaceLibSrc (filePath: string, searchValue: string | RegExp, replaceValue: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  fs.writeFileSync(filePath, content.replace(searchValue, replaceValue))
}

replaceLibSrc(
  path.resolve(__dirname, 'node_modules/@vue/repl/dist/vue-repl.js'),
  /<script[^>]+es-module-shims.wasm.js[^>]+><\/script>/,
  ''
)

// replaceLibSrc(
//   path.resolve(__dirname, 'node_modules/@vue/repl/dist/assets/vue.worker-yX76X78j.js'),
//   // eslint-disable-next-line no-template-curly-in-string
//   'if (msg.data?.event === "init") {',
//   // eslint-disable-next-line no-template-curly-in-string
//   "if (msg.data?.event === 'init') { self.tsUrl = msg.data.tsUrl; "
// )

// replaceLibSrc(
//   path.resolve(__dirname, 'node_modules/@vue/repl/dist/assets/vue.worker-yX76X78j.js'),
//   // eslint-disable-next-line no-template-curly-in-string
//   '`https://cdn.jsdelivr.net/npm/typescript@${tsVersion}/lib/typescript.js`',
//   // eslint-disable-next-line no-template-curly-in-string
//   'self.tsUrl || `https://cdn.jsdelivr.net/npm/typescript@${tsVersion}/lib/typescript.js`'
// )

// replaceLibSrc(
//   path.resolve(__dirname, 'node_modules/@vue/repl/dist/chunks/MonacoEditor-zbZVrXDT.js'),
//   // eslint-disable-next-line no-template-curly-in-string
//   'tsLocale: store.state.typescriptLocale || store.state.locale',
//   // eslint-disable-next-line no-template-curly-in-string
//   'tsLocale: store.state.typescriptLocale || store.state.locale, tsUrl: location.origin + "' + getExtensionBasePath(__EXTENSION_ID__) + '/editor/typescript.js"'
// )

async function genVueProject () {
  const zip = new JSZip()

  // basic structure
  zip.file('index.html', fs.readFileSync(path.resolve(__dirname, 'src/vue/template/index.html'), 'utf-8'))
  zip.file('package.json', fs.readFileSync(path.resolve(__dirname, 'src/vue/template/package.json'), 'utf-8'))
  zip.file('vite.config.js', fs.readFileSync(path.resolve(__dirname, 'src/vue/template/vite.config.js'), 'utf-8'))
  zip.file('README.md', fs.readFileSync(path.resolve(__dirname, 'src/vue/template/README.md'), 'utf-8'))
  zip.file('import-map.json', fs.readFileSync(path.resolve(__dirname, 'src/vue/template/import-map.json'), 'utf-8'))
  zip.file('tsconfig.json', fs.readFileSync(path.resolve(__dirname, 'src/vue/template/tsconfig.json'), 'utf-8'))

  // project src
  const src = zip.folder('src')!
  src.file('main.js', fs.readFileSync(path.resolve(__dirname, 'src/vue/template/src/main.js'), 'utf-8'))
  src.file('App.vue', fs.readFileSync(path.resolve(__dirname, 'src/vue/template/src/App.vue'), 'utf-8'))

  const projectFile = path.resolve(__dirname, 'src/vue/vue-project.zip')
  fs.writeFileSync(projectFile, await zip.generateAsync({ type: 'nodebuffer' }))
}

genVueProject()

// https://vitejs.dev/config/
export default ({ mode }) => defineConfig({
  plugins: [vue(), copy({
    targets: [
      { src: 'src/index.html', dest: 'editor' },
      { src: 'node_modules/vue/dist/vue.runtime.esm-browser.js', dest: 'editor' },
      { src: 'src/vue/vue-project.zip', dest: 'editor' },
    ],
    hook: 'writeBundle',
  })],
  define: {
    __EXTENSION_VERSION__: JSON.stringify(process.env.npm_package_version),
    __EXTENSION_ID__: JSON.stringify(__EXTENSION_ID__),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.IS_PREACT': process.env.IS_PREACT,
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
      external: Object.keys(exLibs),
      output: {
        globals: {
          window: 'window',
          ...exLibs,
        },
      },
    }
  },
})
