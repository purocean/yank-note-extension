import { registerPlugin } from '@yank-note/runtime-api'
import NESEmulator from './NESEmulator.vue'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    ctx.editor.registerCustomEditor({
      name: 'nes-emulator',
      displayName: 'NES Emulator',
      component: NESEmulator,
      hiddenPreview: true,
      when ({ doc }) {
        return !!(doc && doc.name.toLowerCase().endsWith('.nes'))
      }
    })
  }
})
