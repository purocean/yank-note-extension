import { BaseCustomEditor, Ctx, registerPlugin } from '@yank-note/runtime-api'
import type { Components, CustomEditorCtx, Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import i18n from './i18n'
import { FILE_BASE64, MarkdownItPlugin, buildEditorUrl } from './lib'

const extensionName = __EXTENSION_ID__

function initCustomEditor (ctx: Ctx) {
  async function createFile (node: Doc) {
    const currentPath = node.path
    const fileExt = ctx.lib.vue.ref<'.ggb'>('.ggb')

    let filename = await ctx.ui.useModal().input({
      title: i18n.t('create-file'),
      hint: ctx.i18n.t('document.create-dialog.hint'),
      modalWidth: '600px',
      content: ctx.i18n.t('document.current-path', currentPath),
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

    if (fileExt.value === '.ggb') {
      content = FILE_BASE64
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

  class GeoGebraEditor extends BaseCustomEditor {
    name = 'geogebra'
    displayName = 'GeoGebra'
    hiddenPreview = true
    supportedFileTypes = ['.ggb']
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

    createFile (node: Components.Tree.Node) {
      return createFile(node)
    }
  }

  ctx.editor.registerCustomEditor(new GeoGebraEditor())
}

registerPlugin({
  name: extensionName,
  register (ctx) {
    if (!ctx.getPremium()) {
      return
    }

    ctx.markdown.registerPlugin(MarkdownItPlugin)

    initCustomEditor(ctx)

    ctx.editor.tapSimpleCompletionItems(items => {
      /* eslint-disable no-template-curly-in-string */

      items.push(
        { label: '/ []() GeoGebra Link', insertText: '[${2:GeoGebra}]($1){link-type="geogebra"}', block: true },
      )
    })
  }
})
