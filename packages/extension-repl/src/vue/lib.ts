import JSZip from 'jszip'
import { ReplStore } from '@vue/repl'
import { getEditorPath } from '@/lib'
import index from './template/index.html?raw'
import main from './template/main.js?raw'
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

export async function generateVueProject (store: ReplStore): Promise<Blob> {
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
    if (file !== 'import-map.json') {
      src.file(file, files[file])
    } else {
      zip.file(file, files[file])
    }
  }

  return zip.generateAsync({ type: 'blob' })
}
