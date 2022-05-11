import { registerPlugin } from '@yank-note/runtime-api'
import { initMermaidTheme, MarkdownItPlugin } from './mermaid'
import monacoMermaid from './monaco-mermaid'

import './style.css'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    ctx.markdown.registerPlugin(MarkdownItPlugin)

    initMermaidTheme()
    ctx.registerHook('THEME_CHANGE', () => initMermaidTheme())

    ctx.registerHook('VIEW_ON_GET_HTML_FILTER_NODE', async ({ node, options }) => {
      if (options.preferPng && node.tagName === 'IMG' && node.classList.contains('mermaid-image')) {
        try {
          const img = document.createElement('img')
          img.style.position = 'absolute'
          img.style.left = '200vw'
          img.src = (node as HTMLImageElement).src
          document.body.appendChild(img)
          const width = img.clientWidth
          const height = img.clientHeight
          document.body.removeChild(img)

          // svg to img
          const dataUrl = await ctx.lib.domtoimage
            .toPng(node, { width: width * 2, height: height * 2 })
          ;(node as HTMLImageElement).src = dataUrl
        } catch (error) {
          console.error(error)
        }
      }
    })

    ctx.editor.whenEditorReady().then(({ monaco }) => {
      monacoMermaid(monaco)
    })
  }
})
