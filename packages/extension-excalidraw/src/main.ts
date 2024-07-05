import { registerPlugin, BaseCustomEditor } from '@yank-note/runtime-api'
import type { Components, CustomEditorCtx, Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import i18n from './i18n'
import { FILE_JSON, FILE_PNG, FILE_SVG, SETTING_KEY_FONT_HANDWRITING, buildEditorUrl } from './lib'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    type FileTypes = '.excalidraw' | '.excalidraw.svg' | '.excalidraw.png'
    const supportedFileTypes: FileTypes[] = ['.excalidraw', '.excalidraw.svg', '.excalidraw.png']

    async function createFile (node: Doc) {
      const currentPath = node.path
      const fileExt = ctx.lib.vue.ref<FileTypes>('.excalidraw')
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

    class ExcalidrawEditor extends BaseCustomEditor {
      name = 'excalidraw'
      displayName = 'Excalidraw'
      hiddenPreview = true
      supportedFileTypes = supportedFileTypes
      labels = {
        createFile: i18n.t('create-file'),
        openFile: i18n.t('edit-in-new-window'),
      }

      constructor () {
        super()
        ctx.registerHook('SETTING_CHANGED', ({ changedKeys }) => {
          if (changedKeys.includes(SETTING_KEY_FONT_HANDWRITING as any)) {
            const iframe: HTMLIFrameElement | null = document.getElementById(this.iframeId) as HTMLIFrameElement
            iframe?.contentWindow?.location.reload()
          }
        })
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
            id: __EXTENSION_ID__ + '-edit-with-excalidraw',
            type: 'normal',
            ellipsis: false,
            label: i18n.t('edit-with-excalidraw'),
            onClick: async () => {
              ctx.doc.switchDoc(file)
              ctx.editor.switchEditor('excalidraw')
            }
          },
          {
            id: __EXTENSION_ID__ + '-edit-with-excalidraw-new-window',
            type: 'normal',
            ellipsis: false,
            label: i18n.t('edit-with-excalidraw-new-window'),
            hidden: true, // TODO: hide this menu item until we have a better way to sync file changes
            onClick: async () => {
              const url = buildEditorUrl(file)
              ctx.env.openWindow(url, '_blank', { alwaysOnTop: false })
            }
          }
        )
      }
    })

    ctx.editor.registerCustomEditor(new ExcalidrawEditor())

    ctx.setting.changeSchema(schema => {
      if (!schema.groups.some((x: any) => x.value === 'plugin')) {
        schema.groups.push({ value: 'plugin', label: 'Plugin' } as any)
      }

      schema.properties[SETTING_KEY_FONT_HANDWRITING] = {
        title: i18n.$$t('handwriting-font'),
        type: 'string',
        group: 'plugin',
        enum: [''],
        options: {
          enum_titles: ['DEFAULT'],
        },
        required: true,
        defaultValue: '',
      }
    })

    ctx.registerHook('SETTING_PANEL_BEFORE_SHOW', async () => {
      const fonts = ctx.lib.lodash.uniq((await (window as any).queryLocalFonts()).map(x => x.family))

      ctx.setting.changeSchema((schema) => {
        schema.properties[SETTING_KEY_FONT_HANDWRITING].enum = [''].concat(fonts)
      })
    })

    if ('registerDocCategory' in ctx.doc) {
      ctx.doc.registerDocCategory({
        category: 'excalidraw',
        displayName: 'Excalidraw',
        types: [
          {
            id: 'excalidraw-excalidraw',
            displayName: 'Excalidraw File',
            extension: ['.excalidraw'] as [FileTypes],
            buildNewContent: () => FILE_JSON
          },
          {
            id: 'excalidraw-svg',
            displayName: 'Excalidraw SVG',
            extension: ['.excalidraw.svg'] as [FileTypes],
            buildNewContent: () => FILE_SVG
          },
          {
            id: 'excalidraw-png',
            displayName: 'Excalidraw PNG',
            extension: ['.excalidraw.png'] as [FileTypes],
            buildNewContent: () => ({ base64Content: FILE_PNG })
          }
        ]
      })
    }
  }
})
