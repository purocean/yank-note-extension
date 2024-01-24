import { BaseCustomEditor, registerPlugin } from '@yank-note/runtime-api'
import type { Components, CustomEditorCtx, Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import { buildEditorUrl, createDrawioFile } from './lib'
import { MarkdownItPlugin } from './drawio'
import i18n from './i18n'

import './style.css'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    const supportedFileTypes = ['.drawio', '.drawio.svg', '.drawio.png']
    ctx.markdown.registerPlugin(MarkdownItPlugin)

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

    class DrawioEditor extends BaseCustomEditor {
      name = 'drawio'
      displayName = 'Drawio'
      hiddenPreview = true
      supportedFileTypes = supportedFileTypes
      labels = {
        createFile: i18n.t('create-drawio-file'),
        openFile: i18n.t('edit-in-new-window'),
      }

      buildEditorUrl (ctx: CustomEditorCtx) {
        if (!ctx.doc) {
          throw new Error('Need Doc')
        }

        return buildEditorUrl(ctx.doc)
      }

      createFile (node: Components.Tree.Node) {
        return createDrawioFile(node)
      }
    }

    const editor = new DrawioEditor()
    ctx.editor.registerCustomEditor(editor)

    ctx.view.tapContextMenus((items, e) => {
      const el = e.target as HTMLElement
      const originSrc = el.getAttribute(ctx.args.DOM_ATTR_NAME.ORIGIN_SRC)
      const currentFile = ctx.store.state.currentFile

      if (
        el.tagName === 'IMG' &&
        el.getAttribute(ctx.args.DOM_ATTR_NAME.LOCAL_IMAGE) &&
        originSrc &&
        currentFile &&
        editor.supported({ type: 'file', name: ctx.utils.path.basename(originSrc), repo: '', path: originSrc })
      ) {
        const repo = currentFile.repo
        const path = ctx.utils.path.resolve(
          ctx.utils.path.dirname(currentFile.path),
          originSrc
        )

        const name = ctx.utils.path.basename(path)

        const file: Doc = { type: 'file', repo, path, name }

        items.push(
          {
            id: __EXTENSION_ID__ + '-edit-with-drawio',
            type: 'normal',
            ellipsis: false,
            label: i18n.t('edit-with-drawio'),
            onClick: async () => {
              ctx.doc.switchDoc(file)
              ctx.editor.switchEditor('drawio')
            }
          },
        )
      }
    })
  }
})
