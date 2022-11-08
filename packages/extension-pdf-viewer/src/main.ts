import { registerPlugin } from '@yank-note/runtime-api'
import PDFViewer from './PDFViewer.vue'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    ctx.editor.registerCustomEditor({
      name: 'PDFViewer',
      component: PDFViewer,
      hiddenPreview: true,
      when ({ doc }) {
        return !!(doc && doc.name.toLowerCase().endsWith('.pdf'))
      }
    })
  }
})
