import { registerPlugin } from '@yank-note/runtime-api'
import CustomEditor from './CustomEditor.vue'
import type { Components, Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import i18n from './i18n'
import { CUSTOM_EDITOR_IFRAME_ID, FILE_JSON, FILE_PNG, FILE_SVG, buildEditorUrl, supported } from './lib'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    async function createFile (node: Doc) {
      const currentPath = node.path
      const fileExt = ctx.lib.vue.ref<'.excalidraw' | '.excalidraw.svg' | '.excalidraw.png'>('.excalidraw')
      const { h } = ctx.lib.vue

      let filename = await ctx.ui.useModal().input({
        title: i18n.t('create-file'),
        hint: ctx.i18n.t('document.create-dialog.hint'),
        modalWidth: '600px',
        component: h('div', [
          ctx.i18n.t('document.current-path', currentPath),
          h('div', { style: 'margin: 8px 0' }, [
            i18n.t('file-type'),
            h('label', { style: 'margin-right: 8px' }, [h('input', { type: 'radio', name: 'type', value: '.excalidraw', checked: fileExt.value === '.excalidraw', onChange: () => { fileExt.value = '.excalidraw' } }), '.excalidraw']),
            h('label', { style: 'margin: 0 8px' }, [h('input', { type: 'radio', name: 'type', value: '.excalidraw.svg', checked: fileExt.value === '.excalidraw.svg', onChange: () => { fileExt.value = '.excalidraw.svg' } }), '.excalidraw.svg']),
            h('label', { style: 'margin: 0 8px' }, [h('input', { type: 'radio', name: 'type', value: '.excalidraw.png', checked: fileExt.value === '.excalidraw.png', onChange: () => { fileExt.value = '.excalidraw.png' } }), '.excalidraw.png']),
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

      if (fileExt.value === '.excalidraw') {
        isBase64 = false
        content = FILE_JSON
      } else if (fileExt.value === '.excalidraw.svg') {
        isBase64 = false
        content = FILE_SVG
      } else if (fileExt.value === '.excalidraw.png') {
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

    function getFileContextMenu (node: Components.Tree.Node): Components.ContextMenu.Item {
      return {
        id: 'open-excalidraw',
        type: 'normal',
        label: i18n.t('edit-in-new-window'),
        onClick: () => {
          const { repo, path, name, type } = node
          const url = buildEditorUrl({ repo, path, name, type })
          ctx.env.openWindow(url, '_blank', { alwaysOnTop: false })
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
            id: 'create-excalidraw-file',
            type: 'normal',
            label: i18n.t('create-file'),
            onClick: () => createFile(node)
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

    ctx.editor.registerCustomEditor({
      name: 'excalidraw',
      displayName: 'Excalidraw',
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
