import { registerPlugin } from '@yank-note/runtime-api'
import { MarkdownItPlugin } from './echarts'

import './style.css'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    ctx.markdown.registerPlugin(MarkdownItPlugin)
  }
})
