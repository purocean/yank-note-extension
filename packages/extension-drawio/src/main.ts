import { registerPlugin } from '@yank-note/runtime-api'
import { buildEditorSrcdoc, createDrawioFile, MarkdownItPlugin } from './drawio'

import './style.css'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    ctx.markdown.registerPlugin(MarkdownItPlugin)

    ctx.registerHook('TREE_NODE_SELECT', async ({ node }) => {
      if (node.path.toLowerCase().includes('.drawio')) {
        const { repo, path, name, type } = node
        const srcdoc = buildEditorSrcdoc({ repo, path, name, type })
        ctx.env.openWindow(ctx.embed.buildSrc(srcdoc, ctx.i18n.t(`${extensionId}.edit-diagram`, name)), '_blank', { alwaysOnTop: false })

        return true
      }

      return false
    })

    ctx.tree.tapContextMenus((items, node) => {
      if (node.type === 'dir') {
        items.push(
          { type: 'separator' },
          {
            id: 'create-drawio-drawio',
            type: 'normal',
            label: ctx.i18n.t(`${extensionId}.create-drawio-file`, '.drawio'),
            onClick: () => createDrawioFile(node, '.drawio')
          },
          {
            id: 'create-drawio-png',
            type: 'normal',
            label: ctx.i18n.t(`${extensionId}.create-drawio-file`, '.png'),
            onClick: () => createDrawioFile(node, '.drawio.png')
          },
        )
      }
    })

    ctx.registerHook('VIEW_ON_GET_HTML_FILTER_NODE', ({ node }) => {
      if (node.tagName === 'IFRAME' && node.className === 'drawio' && node.dataset.xml) {
        node.style.width = '100%'
        node.style.border = 'none'
        node.style.height = '1024px'
        node.style.maxHeight = '100vh'
        ;(node as HTMLIFrameElement).src =
          'https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=#R' +
          encodeURIComponent(node.dataset.xml)
      }
    })
  }
})
