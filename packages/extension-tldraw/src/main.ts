import { registerPlugin, BaseCustomEditor } from '@yank-note/runtime-api'
import type { Components, CustomEditorCtx, Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import i18n from './i18n'
import { FILE_JSON, FILE_PNG, FILE_SVG, buildEditorUrl } from './lib'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    type FileTypes = '.tldr' | '.tldraw.svg' | '.tldraw.png'
    // const supportedFileTypes: FileTypes[] = ['.tldraw.svg', '.tldraw.png', '.tldr']
    const supportedFileTypes: FileTypes[] = ['.tldr']

    if (!ctx.getPremium()) {
      return
    }

    async function createFile (node: Doc) {
      const currentPath = node.path
      const fileExt = ctx.lib.vue.ref<FileTypes>('.tldr')
      const { h } = ctx.lib.vue

      let filename = await ctx.ui.useModal().input({
        title: i18n.t('create-file'),
        hint: ctx.i18n.t('document.create-dialog.hint'),
        modalWidth: '600px',
        component: h('div', [
          ctx.i18n.t('document.current-path', currentPath),
          h('div', { style: 'margin: 8px 0' }, [
            i18n.t('file-type'),
            // h('label', { style: 'margin-right: 0 8px' }, [h('input', { type: 'radio', name: 'type', value: '.tldraw.svg', checked: fileExt.value === '.tldraw.svg', onChange: () => { fileExt.value = '.tldraw.svg' } }), '.tldraw.svg']),
            // h('label', { style: 'margin: 0 8px' }, [h('input', { type: 'radio', name: 'type', value: '.tldraw.png', checked: fileExt.value === '.tldraw.png', onChange: () => { fileExt.value = '.tldraw.png' } }), '.tldraw.png']),
            h('label', { style: 'margin-right: 8px' }, [h('input', { type: 'radio', name: 'type', value: '.tldraw', checked: fileExt.value === '.tldr', onChange: () => { fileExt.value = '.tldr' } }), '.tldr']),
          ]),
        ]),
        value: 'new',
        select: true
      })

      if (!filename) {
        return
      }

      if (!filename.endsWith(fileExt.value)) {
        filename = filename.replace(/\/$/, '') + fileExt.value
      }

      const path = ctx.utils.path.join(currentPath, filename)

      if (!path) {
        throw new Error('Need Path')
      }

      const file: Doc = { repo: node.repo, path: path, type: 'file', name: filename, contentHash: 'new' }
      let isBase64: boolean
      let content: string

      if (fileExt.value === '.tldr') {
        isBase64 = false
        content = FILE_JSON
      } else if (fileExt.value === '.tldraw.svg') {
        isBase64 = false
        content = FILE_SVG
      } else if (fileExt.value === '.tldraw.png') {
        isBase64 = true
        content = FILE_PNG
      } else {
        throw new Error('Invalid File Type')
      }

      try {
        await ctx.api.writeFile(file, content, isBase64)
        ctx.doc.switchDoc(file)
        ctx.tree.refreshTree()
      } catch (error: any) {
        ctx.ui.useToast().show('warning', error.message)
        console.error(error)
      }
    }

    class TldrawEditor extends BaseCustomEditor {
      name = 'tldraw'
      displayName = 'Tldraw'
      hiddenPreview = true
      supportedFileTypes = supportedFileTypes
      labels = {
        createFile: i18n.t('create-file'),
        openFile: i18n.t('edit-in-new-window'),
      }

      buildEditorUrl (ctx: CustomEditorCtx) {
        if (!ctx.doc) {
          throw new Error('Need Doc')
        }

        return buildEditorUrl(ctx.doc)
      }

      createFile = 'registerDocCategory' in ctx.doc
        ? undefined
        : function (node: Components.Tree.Node) {
          return createFile(node)
        }
    }

    ctx.view.tapContextMenus((items, e) => {
      const el = e.target as HTMLElement
      const originSrc = el.getAttribute(ctx.args.DOM_ATTR_NAME.ORIGIN_SRC)
      const currentFile = ctx.store.state.currentFile

      if (
        el.tagName === 'IMG' &&
        el.getAttribute(ctx.args.DOM_ATTR_NAME.LOCAL_IMAGE) &&
        originSrc &&
        currentFile &&
        supportedFileTypes.some((ext) => originSrc.endsWith(ext))
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
            id: __EXTENSION_ID__ + '-edit-with-tldraw',
            type: 'normal',
            ellipsis: false,
            label: i18n.t('edit-with-tldraw'),
            onClick: async () => {
              ctx.doc.switchDoc(file)
              ctx.editor.switchEditor('tldraw')
            }
          },
          {
            id: __EXTENSION_ID__ + '-edit-with-tldraw-new-window',
            type: 'normal',
            ellipsis: false,
            label: i18n.t('edit-with-tldraw-new-window'),
            hidden: true, // TODO: hide this menu item until we have a better way to sync file changes
            onClick: async () => {
              const url = buildEditorUrl(file)
              ctx.env.openWindow(url, '_blank', { alwaysOnTop: false })
            }
          }
        )
      }
    })

    ctx.editor.registerCustomEditor(new TldrawEditor())

    if ('registerDocCategory' in ctx.doc) {
      ctx.doc.registerDocCategory({
        category: 'tldraw',
        displayName: 'Tldraw',
        types: [
          {
            id: 'tldraw-tldr',
            displayName: 'Tldraw File',
            extension: ['.tldr'] as [FileTypes],
            buildNewContent: () => FILE_JSON
          },
          // {
          //   id: 'tldraw-svg',
          //   displayName: 'Tldraw SVG',
          //   extension: ['.tldraw.svg'] as [FileTypes],
          //   buildNewContent: () => FILE_SVG
          // },
          // {
          //   id: 'tldraw-png',
          //   displayName: 'Tldraw PNG',
          //   extension: ['.tldraw.png'] as [FileTypes],
          //   buildNewContent: () => ({ base64Content: FILE_PNG })
          // }
        ]
      })
    }
  }
})
