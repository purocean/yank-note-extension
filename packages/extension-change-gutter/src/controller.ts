import type { Ctx } from '@yank-note/runtime-api'
import type { editor } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { createApp } from 'vue'
import { BaselineStore } from './baseline-store'
import { ChangePreviewWidget } from './change-preview-widget'
import { createDecorationSpecs } from './decorations'
import { fetchGitBaseline } from './git-rpc'
import { computeLineChanges } from './line-diff'
import { createMinimalTextEdit, restoreHunkContent } from './restore-change'
import type { BaselineSource, ChangeGutterLabels, ChangeHunk, LineDiffResult } from './types'

const renderDelay = 120
const gitRefreshDelay = 200
const gitBaselineMaxAge = 30000

interface ActiveDocument {
  uri: string
  content: string
  absolutePath: string
  encrypted: boolean
}

interface RenderedDiff {
  uri: string
  modelVersion: number
  source: BaselineSource
  result: LineDiffResult
}

export class ChangeGutterController {
  private readonly baselines = new BaselineStore()
  private readonly logger
  private editor: editor.IStandaloneCodeEditor | null = null
  private decorations: editor.IEditorDecorationsCollection | null = null
  private preview: ChangePreviewWidget | null = null
  private renderedDiff: RenderedDiff | null = null
  private renderTimer: ReturnType<typeof setTimeout> | null = null
  private gitRefreshTimer: ReturnType<typeof setTimeout> | null = null
  private readonly skippedDocuments = new Set<string>()

  constructor (
    private readonly ctx: Ctx,
    private readonly getLabels: () => ChangeGutterLabels
  ) {
    this.logger = ctx.utils.getLogger('extension:change-gutter')
  }

  async start () {
    const { editor: monacoEditor } = await this.ctx.editor.whenEditorReady()
    this.editor = monacoEditor
    this.decorations = monacoEditor.createDecorationsCollection()
    this.preview = new ChangePreviewWidget(monacoEditor, name => {
      const element = document.createElement('span')
      element.className = 'yn-change-gutter-preview-icon'
      const app = createApp(this.ctx.components.SvgIcon, {
        name,
        width: '12px',
        height: '12px',
      })
      app.mount(element)
      return {
        element,
        dispose: () => app.unmount(),
      }
    })

    monacoEditor.onDidChangeModel(() => this.activateCurrentDocument())
    monacoEditor.onDidChangeModelContent(() => {
      this.invalidateRenderedDiff()
      this.scheduleEvaluation()
    })
    monacoEditor.onMouseDown(event => this.handleMouseDown(event))
    monacoEditor.onKeyDown(event => {
      if (event.browserEvent.key === 'Escape' && this.preview?.activeHunkId) {
        event.preventDefault()
        event.stopPropagation()
        this.preview.hide()
      }
    })
    this.ctx.registerHook('EDITOR_CURRENT_EDITOR_CHANGE', () => this.activateCurrentDocument())

    this.ctx.store.watch(() => [
      this.ctx.store.state.currentFile?.plain,
      this.ctx.store.state.currentFile?.writeable,
    ], () => this.captureEligibleDocument())

    this.ctx.store.watch(() => this.ctx.store.state.tabs, tabs => {
      const uris = new Set(tabs.map(tab => tab.key))
      this.baselines.retain(uris)
      for (const uri of this.skippedDocuments) {
        if (!uris.has(uri)) {
          this.skippedDocuments.delete(uri)
        }
      }
    })

    window.addEventListener('focus', () => this.scheduleGitRefresh())
    this.activateCurrentDocument()
  }

  refreshLabels () {
    const rendered = this.renderedDiff
    const model = this.editor?.getModel()
    if (
      !rendered ||
      !model ||
      !this.decorations ||
      model.uri.toString() !== rendered.uri ||
      model.getVersionId() !== rendered.modelVersion
    ) {
      return
    }
    this.preview?.hide()
    this.decorations.set(createDecorationSpecs(
      rendered.result.changes,
      rendered.source,
      this.getLabels().decorations
    ))
  }

  private getActiveDocument (): ActiveDocument | null {
    if (!this.editor || !this.ctx.editor.isDefault() || this.ctx.args.FLAG_READONLY) {
      return null
    }

    const doc = this.ctx.store.state.currentFile
    const model = this.editor.getModel()
    if (
      !doc ||
      doc.type !== 'file' ||
      doc.plain !== true ||
      doc.writeable === false ||
      !model
    ) {
      return null
    }

    const uri = this.ctx.doc.toUri(doc)
    if (model.uri.toString() !== uri) {
      return null
    }

    return {
      uri,
      content: model.getValue(),
      absolutePath: doc.absolutePath || '',
      encrypted: this.ctx.doc.isEncrypted(doc),
    }
  }

  private activateCurrentDocument () {
    this.clearTimers()
    this.invalidateRenderedDiff()
    this.decorations?.clear()

    const active = this.getActiveDocument()
    if (!active) {
      return
    }

    const existing = this.baselines.getEntry(active.uri)
    this.baselines.ensureTab(active.uri, active.content)
    if (existing) {
      void this.evaluateActiveDocument(true)
    }
  }

  private captureEligibleDocument () {
    this.clearTimers()
    this.invalidateRenderedDiff()
    this.decorations?.clear()
    const active = this.getActiveDocument()
    if (active) {
      this.baselines.ensureTab(active.uri, active.content)
    }
  }

  private scheduleEvaluation () {
    this.clearRenderTimer()
    this.renderTimer = setTimeout(() => {
      this.renderTimer = null
      void this.evaluateActiveDocument(false)
    }, renderDelay)
  }

  private async evaluateActiveDocument (forceGitRefresh: boolean) {
    const active = this.getActiveDocument()
    if (!active) {
      this.invalidateRenderedDiff()
      this.decorations?.clear()
      return
    }

    const entry = this.baselines.getEntry(active.uri)
    if (!entry) {
      // Model activation normally captures this before content can change.
      this.baselines.ensureTab(active.uri, active.content)
      return
    }

    const shouldRefresh = forceGitRefresh || this.baselines.shouldRefreshGit(
      active.uri,
      Date.now(),
      gitBaselineMaxAge
    )
    const requestId = shouldRefresh ? this.baselines.beginGitCheck(active.uri) : undefined
    if (requestId !== undefined) {
      await this.refreshGitBaseline(active, requestId)
    }

    const current = this.getActiveDocument()
    const currentEntry = current && this.baselines.getEntry(current.uri)
    if (!current || current.uri !== active.uri || !currentEntry) {
      return
    }

    // Avoid briefly showing Tab colors while the first Git lookup is pending.
    if (currentEntry.gitRequestId !== undefined && currentEntry.gitCheckedAt === undefined) {
      return
    }
    this.renderActiveDocument()
  }

  private renderActiveDocument () {
    const active = this.getActiveDocument()
    const baseline = active && this.baselines.get(active.uri)
    if (!active || !baseline || !this.decorations) {
      this.invalidateRenderedDiff()
      this.decorations?.clear()
      return
    }

    const result = computeLineChanges(baseline.content, active.content)
    if (result.skipped) {
      this.invalidateRenderedDiff()
      this.decorations.clear()
      if (!this.skippedDocuments.has(active.uri)) {
        this.skippedDocuments.add(active.uri)
        this.logger.warn('skip expensive diff', active.uri)
      }
      return
    }

    this.skippedDocuments.delete(active.uri)
    this.preview?.hide()
    this.renderedDiff = {
      uri: active.uri,
      modelVersion: this.editor!.getModel()!.getVersionId(),
      source: baseline.source,
      result,
    }
    this.decorations.set(createDecorationSpecs(
      result.changes,
      baseline.source,
      this.getLabels().decorations
    ))
  }

  private handleMouseDown (event: editor.IEditorMouseEvent) {
    const target = event.target
    const gutterType = this.ctx.editor.getMonaco().editor.MouseTargetType.GUTTER_LINE_DECORATIONS
    if (
      !event.event.leftButton ||
      target.type !== gutterType ||
      !target.position ||
      !target.element?.closest('.yn-change-gutter')
    ) {
      return
    }

    const rendered = this.renderedDiff
    const model = this.editor?.getModel()
    if (!rendered || !model || model.uri.toString() !== rendered.uri || model.getVersionId() !== rendered.modelVersion) {
      return
    }

    const change = rendered.result.changes.find(item => (
      target.position!.lineNumber >= item.startLine && target.position!.lineNumber <= item.endLine
    ))
    const hunk = change && rendered.result.hunks.find(item => item.id === change.hunkId)
    if (!hunk) {
      return
    }

    event.event.preventDefault()
    event.event.stopPropagation()
    if (this.preview?.activeHunkId === hunk.id) {
      this.preview.hide()
      return
    }

    const expectedUri = rendered.uri
    const expectedVersion = rendered.modelVersion
    this.preview?.show(
      hunk,
      rendered.source,
      this.getLabels().preview,
      () => this.setCurrentAsBaseline(expectedUri, expectedVersion),
      () => this.refreshBaseline(expectedUri, expectedVersion),
      () => this.restoreHunk(expectedUri, expectedVersion, hunk),
      () => this.showDocumentHistory()
    )
  }

  private showDocumentHistory () {
    this.preview?.hide()
    this.ctx.action.getAction('doc.show-history')?.handler()
  }

  private setCurrentAsBaseline (expectedUri: string, expectedVersion: number) {
    const active = this.getActiveDocument()
    const model = this.editor?.getModel()
    if (!active || !model || active.uri !== expectedUri || model.getVersionId() !== expectedVersion) {
      this.preview?.hide()
      return
    }

    if (!this.baselines.setManual(active.uri, model.getValue())) {
      this.preview?.hide()
      return
    }
    this.invalidateRenderedDiff()
    this.decorations?.clear()
    this.skippedDocuments.delete(active.uri)
    this.editor?.focus()
  }

  private refreshBaseline (expectedUri: string, expectedVersion: number) {
    const active = this.getActiveDocument()
    const model = this.editor?.getModel()
    if (!active || !model || active.uri !== expectedUri || model.getVersionId() !== expectedVersion) {
      this.preview?.hide()
      return
    }

    if (!this.baselines.resetForRefresh(active.uri)) {
      this.preview?.hide()
      return
    }
    this.invalidateRenderedDiff()
    this.decorations?.clear()
    this.skippedDocuments.delete(active.uri)
    void this.evaluateActiveDocument(true)
    this.editor?.focus()
  }

  private restoreHunk (expectedUri: string, expectedVersion: number, hunk: ChangeHunk) {
    const active = this.getActiveDocument()
    const model = this.editor?.getModel()
    if (!active || !model || active.uri !== expectedUri || model.getVersionId() !== expectedVersion) {
      this.preview?.hide()
      return
    }

    const content = model.getValue()
    const restoredContent = restoreHunkContent(content, hunk, model.getEOL())
    const edit = restoredContent === null ? null : createMinimalTextEdit(content, restoredContent)
    if (!edit) {
      this.preview?.hide()
      return
    }

    const start = model.getPositionAt(edit.startOffset)
    const end = model.getPositionAt(edit.endOffset)
    this.preview?.hide()
    this.editor!.pushUndoStop()
    this.editor!.executeEdits('change-gutter.restore', [{
      range: {
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column,
      },
      text: edit.text,
      forceMoveMarkers: true,
    }])
    this.editor!.pushUndoStop()
    this.editor!.focus()
  }

  private invalidateRenderedDiff () {
    this.preview?.hide()
    this.renderedDiff = null
  }

  private scheduleGitRefresh () {
    this.invalidateRenderedDiff()
    if (this.gitRefreshTimer) {
      clearTimeout(this.gitRefreshTimer)
    }
    this.gitRefreshTimer = setTimeout(() => {
      this.gitRefreshTimer = null
      void this.evaluateActiveDocument(true)
    }, gitRefreshDelay)
  }

  private async refreshGitBaseline (active: ActiveDocument, requestId: number) {
    if (this.ctx.args.FLAG_MAS || active.encrypted || !active.absolutePath) {
      this.baselines.finishGitCheck(active.uri, requestId, Date.now())
      return
    }

    const currentBaseline = this.baselines.get(active.uri)
    const knownRevision = currentBaseline?.source === 'git' && currentBaseline.fileState === 'tracked'
      ? currentBaseline.revision
      : undefined
    try {
      const result = await fetchGitBaseline(this.ctx, {
        absolutePath: active.absolutePath,
        knownRevision,
      })
      this.baselines.applyGitResult(active.uri, requestId, result, Date.now())
    } catch (error) {
      this.baselines.finishGitCheck(active.uri, requestId, Date.now())
      this.logger.debug('Git baseline unavailable; keep current baseline', error)
    }
  }

  private clearRenderTimer () {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer)
      this.renderTimer = null
    }
  }

  private clearTimers () {
    this.clearRenderTimer()
    if (this.gitRefreshTimer) {
      clearTimeout(this.gitRefreshTimer)
      this.gitRefreshTimer = null
    }
  }
}
