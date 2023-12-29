import { registerPlugin } from '@yank-note/runtime-api'
import type { Components, Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import i18n from './i18n'
import { CUSTOM_EDITOR_IFRAME_ID, buildEditorUrl, supported } from './lib'
import { generateVueProject, getDefaultReplStore } from './vue/lib'
import CustomEditor from './CustomEditor.vue'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    async function createFile (node: Doc) {
      const currentPath = node.path
      const fileExt = ctx.lib.vue.ref<'.vueapp.zip' | '.reactapp.zip'>('.vueapp.zip')
      const { h } = ctx.lib.vue

      let filename = await ctx.ui.useModal().input({
        title: i18n.t('create-file'),
        hint: ctx.i18n.t('document.create-dialog.hint'),
        modalWidth: '600px',
        component: h('div', [
          ctx.i18n.t('document.current-path', currentPath),
          h('div', { style: 'margin: 8px 0' }, [
            i18n.t('file-type'),
            h('label', { style: 'margin-right: 8px' }, [h('input', { type: 'radio', name: 'type', value: '.vueapp.zip', checked: fileExt.value === '.vueapp.zip', onChange: () => { fileExt.value = '.vueapp.zip' } }), 'Vue']),
            // h('label', { style: 'margin: 0 8px' }, [h('input', { type: 'radio', name: 'type', value: '.reactapp.zip', checked: fileExt.value === '.reactapp.zip', onChange: () => { fileExt.value = '.reactapp.zip' } }), 'React']),
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
      let content = ''

      if (fileExt.value === '.vueapp.zip') {
        const store = getDefaultReplStore()
        const project = await generateVueProject(store)
        content = (await ctx.utils.fileToBase64URL(project)).replace(/^data:.*?base64,/, '')
      }

      try {
        if (!content) {
          throw new Error('Need Content')
        }

        await ctx.api.writeFile(file, content, true)
        ctx.doc.switchDoc(file)
        ctx.tree.refreshTree()
      } catch (error: any) {
        ctx.ui.useToast().show('warning', error.message)
        console.error(error)
      }
    }

    function getFileContextMenu (node: Components.Tree.Node): Components.ContextMenu.Item {
      return {
        id: 'open-repl',
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
            id: 'create-repl-file',
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
      name: 'repl-app',
      displayName: 'Repl App',
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
