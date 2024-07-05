import { BaseCustomEditor, Ctx, registerPlugin } from '@yank-note/runtime-api'
import type { Components, CustomEditorCtx, Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import i18n from './i18n'
import { MarkdownItPlugin, buildEditorUrl, getEditorPath } from './lib'
import appSrc from './vue/template/src/App.vue?raw'

const extensionName = __EXTENSION_ID__

type FileTypes = '.vueapp.zip' | '.reactapp.zip'

function initCustomEditor (ctx: Ctx) {
  async function createFile (node: Doc) {
    const currentPath = node.path
    const fileExt = ctx.lib.vue.ref<FileTypes>('.vueapp.zip')
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
      const blob = await (await fetch(getEditorPath('vue-project.zip'))).blob()
      content = (await ctx.utils.fileToBase64URL(blob)).replace(/^data:.*?base64,/, '')
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

  class ReplEditor extends BaseCustomEditor {
    name = 'repl'
    displayName = 'Repl'
    hiddenPreview = true
    supportedFileTypes = ['.vueapp.zip']
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

  ctx.editor.registerCustomEditor(new ReplEditor())
}

registerPlugin({
  name: extensionName,
  register (ctx) {
    initCustomEditor(ctx)
    ctx.markdown.registerPlugin(md => {
      md.use(MarkdownItPlugin)
    })

    ctx.editor.tapSimpleCompletionItems(items => {
      /* eslint-disable no-template-curly-in-string */

      items.push(
        {
          label: '/ ``` Applet Vue Repl',
          insertText: '```vue\n<!-- --applet-- ${1:DEMO} -->\n' +
            appSrc.replace(/<style.*>.*<\/style>/s, '<style>\nh1 {\n  color: red;\n}\n</style>') +
            '```\n',
          block: true,
        },
      )
    })

    if ('registerDocCategory' in ctx.doc) {
      ctx.doc.registerDocCategory({
        category: 'repl',
        displayName: 'Repl Application',
        types: [
          {
            id: 'repl-vueapp',
            displayName: i18n.$$t('vue-file'),
            extension: ['.vueapp.zip'] as [FileTypes],
            buildNewContent: async () => {
              return (await fetch(getEditorPath('vue-project.zip'))).blob()
            }
          },
        ]
      })
    }
  }
})
