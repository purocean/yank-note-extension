import { registerPlugin } from '@yank-note/runtime-api'
import TextComparator from './TextComparator.vue'
import { editorDocType } from './lib'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    const comparatorRef = ctx.lib.vue.ref()
    ctx.editor.registerCustomEditor({
      name: 'text-comparator',
      displayName: 'Text Comparator',
      component: () => ctx.lib.vue.h(TextComparator, { ref: comparatorRef as any }),
      hiddenPreview: true,
      supportNonNormalFile: true,
      when ({ doc }) {
        return doc?.type === editorDocType
      },
      getIsDirty () {
        return comparatorRef.value.getAndSyncIsDirty()
      },
    }, true)
  }
})
