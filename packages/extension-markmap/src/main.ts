import { registerPlugin } from '@yank-note/runtime-api'
import MarkmapPreviewer from './MarkmapPreviewer.vue'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    ctx.view.registerPreviewer({
      name: 'Markmap',
      component: MarkmapPreviewer,
    })
  }
})
