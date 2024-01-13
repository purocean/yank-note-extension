import JSZip from 'jszip'
import { File, ReplStore } from '@vue/repl'
import { getEditorPath } from '@/lib'
import index from './template/index.html?raw'
import main from './template/src/main.js?raw'
import pkg from './template/package.json?raw'
import config from './template/vite.config.js?raw'
import readme from './template/README.md?raw'

export function getDefaultReplStore () {
  return new ReplStore({
    serializedState: '',
    productionMode: false,
    defaultVueRuntimeURL: getEditorPath('/vue.runtime.esm-browser.js'),
  })
}

export function replStoreToVueProject (store: ReplStore) {
  const zip = new JSZip()

  // basic structure
  zip.file('index.html', index)
  zip.file('package.json', pkg)
  zip.file('vite.config.js', config)
  zip.file('README.md', readme)

  // project src
  const src = zip.folder('src')!
  src.file('main.js', main)

  const files = store.getFiles()
  for (const file in files) {
    if (file !== 'import-map.json' && file !== 'tsconfig.json') {
      src.file(file, files[file])
    } else {
      zip.file(file, files[file])
    }
  }

  return zip
}

export async function vueProjectToReplStore (zip: JSZip) {
  const store = getDefaultReplStore()

  const files = zip.files
  for (const file in files) {
    if (files[file].dir) {
      continue
    }

    if (file.startsWith('src')) {
      if (file === 'src/main.js') {
        continue
      }

      const content = await files[file].async('text')
      store.addFile(new File(file, content))
    } else if (file === 'import-map.json') {
      store.setImportMap(JSON.parse(await files[file].async('text')))
    } else if (file === 'tsconfig.json') {
      store.setTsConfig(JSON.parse(await files[file].async('text')))
    }
  }

  if (files['src/App.vue']) {
    store.setActive('src/App.vue')
  }

  return store
}

export function base64ToVueProject (base64: string) {
  return JSZip.loadAsync(base64, { base64: true })
}

export async function vueProjectToBase64 (zip: JSZip) {
  return zip.generateAsync({ type: 'base64' })
}
