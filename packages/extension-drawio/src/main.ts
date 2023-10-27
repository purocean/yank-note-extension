import { registerPlugin } from '@yank-note/runtime-api'
import type { Components } from '@yank-note/runtime-api/types/types/renderer/types'
import { buildEditorSrcdoc, createDrawioFile, CUSTOM_EDITOR_IFRAME_ID, MarkdownItPlugin, supported } from './drawio'
import i18n from './i18n'
import CustomEditor from './CustomEditor.vue'

import './style.css'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    ctx.markdown.registerPlugin(MarkdownItPlugin)

    function getFileContextMenu (node: Components.Tree.Node): Components.ContextMenu.Item {
      return {
        id: 'open-drawio',
        type: 'normal',
        label: i18n.t('edit-in-new-window'),
        onClick: () => {
          const { repo, path, name, type } = node
          const srcdoc = buildEditorSrcdoc({ repo, path, name, type })
          ctx.env.openWindow(ctx.embed.buildSrc(srcdoc, i18n.t('edit-diagram', name)), '_blank', { alwaysOnTop: false })
        }
      }
    }

    ctx.tree.tapContextMenus((items, node) => {
      if (ctx.args.FLAG_READONLY) {
        return
      }

      if (node.type === 'dir') {
        items.push(
          { type: 'separator' },
          {
            id: 'create-drawio-drawio',
            type: 'normal',
            label: i18n.t('create-drawio-file'),
            onClick: () => createDrawioFile(node)
          },
        )
      } else if (node.type === 'file' && supported(node)) {
        items.unshift(
          getFileContextMenu(node),
          { type: 'separator' },
        )
      }
    })

    ctx.workbench.FileTabs.tapTabContextMenus((items, tab) => {
      if (ctx.args.FLAG_READONLY) {
        return
      }

      const doc = tab.payload.file

      if (doc && supported(doc)) {
        items.push(
          { type: 'separator' },
          getFileContextMenu(doc),
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

    ctx.editor.registerCustomEditor({
      name: 'drawio',
      displayName: 'Drawio',
      component: CustomEditor,
      hiddenPreview: true,
      when ({ doc }) {
        return supported(doc)
      },
      getIsDirty () {
        const iframe = document.getElementById(CUSTOM_EDITOR_IFRAME_ID) as HTMLIFrameElement
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return !!(iframe?.contentWindow?.getIsDirty?.())
      }
    })
  }
})
