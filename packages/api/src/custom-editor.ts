import type { Ctx } from '@fe/context'
import type { Components, CustomEditor, CustomEditorCtx, Doc } from '@fe/types'

export interface EditorIframeCtx {
  setEditorStatus: (status: Doc['status']) => void
}

const ctx: Ctx = globalThis.ctx

export abstract class BaseCustomEditor implements CustomEditor {
  abstract name: string;
  abstract displayName: string;
  abstract hiddenPreview?: boolean;
  abstract supportedFileTypes: string[];
  abstract labels?: {
    createFile?: string,
    openFile?: string,
  }

  abstract buildEditorUrl (ctx: CustomEditorCtx): string
  abstract createFile?(node: Components.Tree.Node): void

  iframeId = 'custom-editor-iframe-' + Math.random()
  component: any

  constructor () {
    this.registerContextMenu()
    this.component = this.buildCustomComponent()
  }

  registerContextMenu () {
    ctx.tree.tapContextMenus((items, node) => {
      if (ctx.args.FLAG_READONLY) {
        return
      }

      if (node.type === 'dir') {
        if (this.createFile) {
          items.push(
            { type: 'separator' },
            {
              id: 'custom-editor-create-file-' + Date.now(),
              type: 'normal',
              label: this.labels?.createFile,
              onClick: () => this.createFile!(node)
            },
          )
        }
      } else if (node.type === 'file' && this.supported(node)) {
        items.unshift(...this.getFileContextMenu(node, 'file-tree'))
      }
    })

    ctx.workbench.FileTabs.tapTabContextMenus((items, tab) => {
      if (ctx.args.FLAG_READONLY) {
        return
      }

      const doc = tab.payload.file

      if (doc && this.supported(doc)) {
        items.push(...this.getFileContextMenu(doc, 'file-tabs'))
      }
    })
  }

  getFileContextMenu (node: Components.Tree.Node, location: 'file-tree' | 'file-tabs'): Components.ContextMenu.Item[] {
    const item: Components.ContextMenu.Item = {
      id: 'custom-editor-open-' + Date.now(),
      type: 'normal',
      label: this.labels?.openFile,
      onClick: () => {
        const { repo, path, name, type } = node
        const url = this.buildEditorUrl({ doc: { repo, path, name, type } })
        ctx.env.openWindow(url, '_blank', { alwaysOnTop: false })
      }
    }

    if (location === 'file-tree') {
      return [item, { type: 'separator' }]
    } else if (location === 'file-tabs') {
      return [{ type: 'separator' }, item]
    }

    return []
  }

  supported (doc?: Doc | null) {
    return !!(doc && this.supportedFileTypes.some(type => doc.path.endsWith(type)))
  }

  when (ctx: CustomEditorCtx) {
    return this.supported(ctx.doc)
  }

  getIsDirty () {
    const iframe = document.getElementById(this.iframeId) as HTMLIFrameElement
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return !!(iframe?.contentWindow?.getIsDirty?.())
  }

  buildCustomComponent () {
    const buildEditorUrl = this.buildEditorUrl.bind(this)
    const { watchEffect, nextTick, defineComponent, h, ref } = ctx.lib.vue
    const supported = this.supported.bind(this)
    const id = this.iframeId

    return defineComponent({
      setup () {
        const url = ref('')

        watchEffect(() => {
          const currentFile = ctx.store.state.currentFile
          url.value = ''

          nextTick(() => {
            if (currentFile && supported(currentFile)) {
              url.value = buildEditorUrl({ doc: currentFile })
            }
          })
        })

        return () => h(
          'div',
          { class: 'custom-editor', style: 'height: 100%; width: 100%; border-top: 1px var(--g-color-70) solid;' },
          url.value ? [h('iframe', { id, src: url.value, style: 'height: 100%; width: 100%; border: none;' })] : []
        )
      }
    })
  }
}

export class CustomEditorFileIO {
  ctx: Ctx;
  file: Doc;
  contentHash: string;

  constructor (ctx: Ctx, file: Doc) {
    this.ctx = ctx
    this.file = file
  }

  async read (asBase64?: boolean) {
    const res = await ctx.api.readFile(this.file, asBase64)
    this.contentHash = res.hash
    return res.content
  }

  async write (content: string, isBase64?: boolean): Promise<void> {
    const res = await ctx.api.writeFile({ ...this.file, contentHash: this.contentHash }, content, isBase64)
    this.contentHash = res.hash
  }

  setStatus (status: NonNullable<Doc['status']>) {
    this.file.status = status

    // sync status to currentFile in store, only handle in iframe
    if (!window.opener && this.ctx.store.state.currentFile && this.ctx.doc.isSameFile(this.ctx.store.state.currentFile, this.file)) {
      this.ctx.store.state.currentFile.status = status
    }
  }

  isDirty () {
    return this.file.status === 'save-failed' || this.file.status === 'unsaved'
  }
}

export abstract class BaseCustomEditorContent {
  ctx: Ctx;
  io: CustomEditorFileIO
  listenSaveKeybinding = true;
  private autoSaveTimer: number | null = null;

  constructor () {
    const search = new URLSearchParams(window.location.search)
    const name = search.get('name')
    const path = search.get('path')
    const repo = search.get('repo')

    if (!name || !path || !repo) {
      throw new Error('Invalid File')
    }

    this.ctx = (window.opener || window.parent || window).ctx
    this.io = new CustomEditorFileIO(this.ctx, { type: 'file', name, path, repo })

    this._exposeVars()
    this._listenStatusChange()
    this._listenCloseWindow()
    this._listenKeybinding()
  }

  _listenStatusChange () {
    const windowTitle = this.io.file.name + ' - ' + window.document.title
    window.document.title = windowTitle

    const _setStatus = this.io.setStatus.bind(this.io)
    this.io.setStatus = (status: Doc['status']) => {
      _setStatus(status)
      if (window.opener) {
        const newTitle = this.io.isDirty() ? '*' + windowTitle : windowTitle
        if (newTitle !== document.title) {
          document.title = newTitle
        }
      }
    }
  }

  _listenCloseWindow () {
    // open in iframe, do nothing
    if (!window.opener) {
      return
    }

    if (this.ctx.env.isElectron) {
      let closeWindow = false
      const remote = this.ctx.env.nodeRequire && this.ctx.env.nodeRequire('@electron/remote')
      window.onbeforeunload = evt => {
        if (!this.getIsDirty() || closeWindow) {
          return null
        }

        if (!remote) {
          return true
        }

        evt.returnValue = true

        setTimeout(async () => {
          const result = remote.dialog.showMessageBoxSync({
            type: 'question',
            cancelId: 1,
            message: this.ctx.i18n.t('quit-check-dialog.desc'),
            buttons: [
              this.ctx.i18n.t('save'),
              this.ctx.i18n.t('quit-check-dialog.buttons.discard'),
              this.ctx.i18n.t('quit-check-dialog.buttons.cancel'),
            ]
          })

          if (result === 0) {
            await this.save()
            closeWindow = true
            window.close()
          } else if (result === 1) {
            closeWindow = true
            window.close()
          }
        }, 0)
      }
    } else {
      window.onbeforeunload = () => !this.getIsDirty() ? null : true
    }
  }

  _listenKeybinding () {
    if (!this.listenSaveKeybinding) {
      return
    }

    window.addEventListener('keydown', evt => {
      if (evt.key === 's' && (evt.ctrlKey || evt.metaKey)) {
        evt.preventDefault()
        evt.stopPropagation()
        this.save()
      }
    }, true)
  }

  _exposeVars () {
    (window as any)._customEditor = this
    ;(window as any).getIsDirty = () => this.getIsDirty()
  }

  triggerAutoSave () {
    const autoSaveInterval = this.ctx.setting.getSetting('auto-save', 4000)
    if (!autoSaveInterval) {
      return
    }

    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
      this.autoSaveTimer = null
    }

    this.autoSaveTimer = setTimeout(() => {
      this.save()
      this.autoSaveTimer = null
    }, autoSaveInterval) as unknown as number
  }

  getIsDirty () {
    return this.io.isDirty()
  }

  abstract init(): void
  abstract save(): Promise<void>
}
