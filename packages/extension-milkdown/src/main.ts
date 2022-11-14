import { registerPlugin } from '@yank-note/runtime-api'
import CustomEditor from './CustomEditor.vue'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    ctx.editor.registerCustomEditor({
      name: 'Milkdown',
      component: CustomEditor,
      when ({ doc }) {
        return !!(doc && ctx.doc.isMarkdownFile(doc))
      }
    })
  }
})
