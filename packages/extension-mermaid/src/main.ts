import { registerPlugin } from '@yank-note/runtime-api'
import { FileType, i18n, initMermaidTheme, supported } from './lib'
import { MarkdownItPlugin } from './mermaid'
import monacoMermaid from './monaco-mermaid'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'

import './style.css'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    ctx.markdown.registerPlugin(MarkdownItPlugin)

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

    if ('registerDocCategory' in ctx.doc) {
      const mermaidContent = `graph LR
A[Hard] -->|Text| B(Round)
B --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]
`

      ctx.doc.registerDocCategory({
        category: 'mermaid',
        displayName: 'Mermaid',
        types: [
          {
            id: 'mermaid-mmd',
            displayName: 'Mermaid File',
            extension: ['.mmd' as FileType],
            plain: true,
            buildNewContent: () => mermaidContent,
          },
          {
            id: 'mermaid-mermaid',
            displayName: 'Mermaid File',
            extension: ['.mermaid' as FileType],
            plain: true,
            buildNewContent: () => mermaidContent
          },
        ]
      })
    }

    if (ctx.renderer && 'registerRenderer' in ctx.renderer) {
      ctx.renderer.registerRenderer({
        name: 'mermaid',
        when (env) {
          return supported(env.file?.path || '')
        },
        render (src, env) {
          return src ? ctx.markdown.markdown.render(`~~~mermaid\n${src}\n~~~`, env) : ctx.lib.vue.h('i', 'Empty content')
        },
      })
    }

    ctx.editor.tapSimpleCompletionItems(items => {
      /* eslint-disable no-template-curly-in-string */

      items.push(
        { label: '/ []() Mermaid Link', insertText: '[${2:Mermaid}]($1){link-type="mermaid"}', block: true },
      )
    })

    ctx.view.tapContextMenus((items, e) => {
      const el = e.target as HTMLElement
      const { repo, path } = el.dataset

      if (el.tagName === 'IMG' && repo && path && supported(path)) {
        const name = ctx.utils.path.basename(path)

        const file: Doc = { type: 'file', repo, path, name }

        items.push(
          {
            id: __EXTENSION_ID__ + '-edit-mermaid-diagram',
            type: 'normal',
            ellipsis: false,
            label: i18n.t('edit-mermaid-diagram'),
            onClick: async () => {
              ctx.doc.switchDoc(file)
            }
          },
        )
      }
    })
  }
})
