/* eslint-disable quote-props */
import { ctx, Ctx, CustomEditorFileIO } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'

export const i18n = ctx.i18n.createI18n({
  en: {
    'left': 'Left Side',
    'right': 'Right Side',
    'swap': 'Swap Sides',
    'side-by-side': 'Side by Side View',
    'word-wrap': 'Enable Word Wrap',
    'readonly': 'Read Only',
    'file': 'File in Repository',
    'text': 'Temporary Text',
    'change': 'Change'
  },
  'zh-CN': {
    'left': '左侧',
    'right': '右侧',
    'swap': '交换位置',
    'side-by-side': '并排显示',
    'word-wrap': '启用自动换行',
    'readonly': '只读模式',
    'file': '仓库的文件',
    'text': '临时文本',
    'change': '更改'
  }
})

export const editorDocType = '__comparator' as const

export class XCustomEditorIO extends CustomEditorFileIO {
  private autoSaveTimer: number | null = null
  private model: Monaco.editor.ITextModel
  private isReady: Promise<void>
  private onStatusChanged: () => void
  private tempTextDir = __EXTENSION_ID__.replaceAll('/', '$')

  constructor (ctx: Ctx, file: Doc, onStatusChanged: () => void) {
    super(ctx, file)
    this.onStatusChanged = onStatusChanged
    this.isReady = this.init()
  }

  async init () {
    const content = await this.read()
    const monaco = this.ctx.editor.getMonaco()
    this.model = monaco.editor.createModel(content, undefined, monaco.Uri.parse(this.getDiffFileUri(this.file)))
    this.model.onDidChangeContent(() => {
      this.setStatus('unsaved')
      this.triggerAutoSave()
    })
  }

  async getModel () {
    await this.isReady
    return this.model
  }

  getDiffFileUri (doc?: Doc | null) {
    if (doc && doc.repo === editorDocType) {
      return `text-comparator://${doc.path}`
    }

    return this.ctx.doc.toUri(doc).replace('yank-note://', 'text-comparator://')
  }

  async read () {
    if (this.file.repo === editorDocType) {
      try {
        const r = await this.ctx.api.readUserFile(this.tempTextDir + this.file.path)
        return await r.text()
      } catch {
        return ''
      }
    }

    return super.read()
  }

  async write (val: string) {
    if (this.file.repo === editorDocType) {
      await this.ctx.api.writeUserFile(this.tempTextDir + this.file.path, val)
      return
    }

    await super.write(val)
  }

  async save () {
    if (this.file.status === 'saved') {
      return
    }

    await this.write(this.model.getValue()).then(() => {
      this.setStatus('saved')
    }).catch(() => {
      this.setStatus('save-failed')
    })
  }

  setStatus (status: NonNullable<Doc['status']>): void {
    super.setStatus(status)
    this.onStatusChanged()
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
}
