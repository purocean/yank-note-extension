import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { ctx } from '@yank-note/runtime-api'
import { EDIT_ACTION_NAME, TEXT_TO_IMAGE_ACTION_NAME, globalCancelTokenSource, i18n, loading, state } from './core'
import { getAdapter } from './adapter'
import { languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'

export async function executeEdit (token: Monaco.CancellationToken, updateStatus: (status: string) => void): Promise<boolean> {
  if (!state.enable) {
    return false
  }

  if (!ctx.getPremium()) {
    ctx.ui.useToast().show('warning', i18n.t('ai-premium-required'), 2000)
    ctx.showPremium()
    return false
  }

  globalCancelTokenSource.value = new (ctx.editor.getMonaco().CancellationTokenSource)(token)
  token = globalCancelTokenSource.value.token

  const initSelectedRange = ctx.editor.getEditor().getSelection()

  if (token.isCancellationRequested || !initSelectedRange) {
    return false
  }

  const cancelPromise = new Promise<void>((resolve) => {
    token.onCancellationRequested(() => { resolve() })
  })

  token.onCancellationRequested(() => {
    loading.value = false
  })

  try {
    loading.value = true
    const adapter = getAdapter('edit', state.adapter.edit)
    if (!adapter) {
      throw new Error(`No edit adapter [${state.adapter.edit}]`)
    }

    const instruction = adapter.state.instruction
    const appendMode = adapter.state.appendMode

    if (!instruction.trim()) {
      throw new Error('Instruction is required')
    }

    state.instructionHistory.edit.unshift(instruction)
    state.instructionHistory.edit = ctx.lib.lodash.uniq(state.instructionHistory.edit.slice(0, 16))

    const monaco = ctx.editor.getMonaco()
    const editor = ctx.editor.getEditor()
    const model = editor.getModel()

    if (!model) {
      throw new Error('No editor model')
    }

    const selection = editor.getSelection()
    const selectedText = selection ? model.getValueInRange(selection) : ''

    const getSelection = () => {
      const selection = ctx.editor.getEditor().getSelection()!

      if (initSelectedRange.isEmpty() && selection.isEmpty()) {
        return initSelectedRange.setEndPosition(selection.endLineNumber, selection.endColumn)
      }

      if (selection.startLineNumber !== initSelectedRange.startLineNumber || selection.startColumn !== initSelectedRange.startColumn) {
        globalCancelTokenSource.value?.cancel()
        throw new Error('Edit range changed, cancel editing.')
      }

      return selection
    }

    const getLineCount = (text: string, start: number, end: number) => {
      let lineCount = 0
      let endLineLength = 0

      for (let i = start; i < end; i++) {
        endLineLength++

        if (text[i] === '\n') {
          lineCount++
          endLineLength = 0
        }
      }

      return { lineCount, endLineLength }
    }

    const getPreserveContent = () => {
      if (!appendMode || !selectedText) {
        return ''
      }

      let separator = ''

      // select whole lines
      if (selection!.startColumn === 1 && selection!.endColumn === model.getLineMaxColumn(selection!.endLineNumber)) {
        const hasEmptyLine = selectedText.includes('\n\n')
        separator = hasEmptyLine ? '\n\n' : '\n'
      } else {
        separator = ' '
      }

      return selectedText + separator
    }

    const preserveContent = getPreserveContent()

    let executeEditCount = 0
    const res = adapter.fetchEditResults(selectedText, instruction, token, ({ text, delta }) => {
      if (model !== editor.getModel()) {
        throw new Error('Model changed, cancel editing.')
      }

      text = preserveContent + text
      if (executeEditCount === 0) {
        delta = preserveContent + delta
      }

      executeEditCount++

      const prevContentCount = getLineCount(text, 0, text.length - delta.length)
      const deltaContentCount = getLineCount(delta, 0, delta.length)

      const selection = getSelection()

      const startLineNumber = selection.startLineNumber + prevContentCount.lineCount
      const startColumn = prevContentCount.endLineLength + (prevContentCount.lineCount > 0 ? 1 : selection.startColumn)

      let endLineNumber: number = startLineNumber + deltaContentCount.lineCount
      let endColumn: number

      // edit in the selection
      if (endLineNumber >= selection.endLineNumber) {
        endLineNumber = selection.endLineNumber
        endColumn = selection.endColumn
      } else {
        // edit the whole line
        endColumn = model.getLineMaxColumn(endLineNumber)
      }

      const editRange = new monaco.Range(startLineNumber, startColumn, endLineNumber, endColumn)

      editor.executeEdits('ai-copilot', [{
        range: editRange,
        text: delta + '🚧',
      }])

      editor.revealRangeNearTopIfOutsideViewport(editRange)
    }, updateStatus)

    const result = await Promise.race([res, cancelPromise])

    if (!result || token.isCancellationRequested || model !== editor.getModel()) {
      return false
    }

    editor.executeEdits('ai-copilot', [{
      range: getSelection(),
      text: preserveContent + result,
    }])

    editor.focus()
    return true
  } catch (error: any) {
    ctx.ui.useToast().show('warning', error.message || `${error}`, 5000)
    throw error
  } finally {
    loading.value = false
    const editor = ctx.editor.getEditor()
    if (initSelectedRange) {
      editor.revealRangeNearTopIfOutsideViewport(initSelectedRange.collapseToStart())
    }
  }
}

export async function executeTextToImage (token: Monaco.CancellationToken, updateStatus: (status: string) => void): Promise<false | Blob> {
  if (!state.enable) {
    return false
  }

  if (!ctx.getPremium()) {
    ctx.ui.useToast().show('warning', i18n.t('ai-premium-required'), 2000)
    ctx.showPremium()
    return false
  }

  globalCancelTokenSource.value = new (ctx.editor.getMonaco().CancellationTokenSource)(token)
  token = globalCancelTokenSource.value.token

  if (token.isCancellationRequested) {
    return false
  }

  const cancelPromise = new Promise<void>((resolve) => {
    token.onCancellationRequested(() => { resolve() })
  })

  token.onCancellationRequested(() => {
    loading.value = false
  })

  try {
    loading.value = true
    const adapter = getAdapter('text2image', state.adapter.text2image)
    if (!adapter) {
      throw new Error(`No text to image adapter [${state.adapter.edit}]`)
    }

    const instruction = adapter.state.instruction

    if (!instruction.trim()) {
      throw new Error('Instruction is required')
    }

    state.instructionHistory.text2image.unshift(instruction)
    state.instructionHistory.text2image = ctx.lib.lodash.uniq(state.instructionHistory.text2image.slice(0, 16))

    const controller = new AbortController()
    token.onCancellationRequested(() => controller.abort())
    window.__PLUGIN_AI_COPILOT_FETCH = function (url: string | Request, options: RequestInit) {
      return ctx.api.proxyFetch(url as string, { ...options, proxy: adapter.state.proxy, signal: controller.signal })
    }

    updateStatus('')
    const res = adapter.fetchTextToImageResults(instruction, token, updateStatus)

    const result = await Promise.race([res, cancelPromise])

    if (!result || token.isCancellationRequested) {
      return false
    }

    return result
  } catch (error: any) {
    ctx.ui.useToast().show('warning', error.message || `${error}`, 5000)
    throw error
  } finally {
    loading.value = false
    updateStatus('')
    delete window.__PLUGIN_AI_COPILOT_FETCH
  }
}

export class CodeActionProvider implements Monaco.languages.CodeActionProvider {
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CodeActionProvider')

  provideCodeActions (model: Monaco.editor.ITextModel, range: Monaco.Range): Monaco.languages.ProviderResult<Monaco.languages.CodeActionList> {
    if (!state.enable) {
      return { dispose: () => 0, actions: [] }
    }

    // no selection and cursor not in end of line, no actions
    if (range.isEmpty() && model.getLineMaxColumn(range.startLineNumber) !== range.endColumn) {
      return { dispose: () => 0, actions: [] }
    }

    const editTitle = range.isEmpty() ? i18n.t('ai-generate') : i18n.t('ai-edit')

    const actions: Monaco.languages.CodeAction[] = [{
      title: editTitle,
      command: { id: EDIT_ACTION_NAME, title: editTitle },
      kind: 'refactor',
      diagnostics: [],
      isPreferred: true,
      isAI: true
    }]

    // on empty line, and no selection, add text2image action
    if (range.isEmpty() && model.getLineContent(range.startLineNumber).trim() === '') {
      const text2imageTitle = i18n.t('ai-text-to-image')
      actions.push({
        title: text2imageTitle,
        command: { id: TEXT_TO_IMAGE_ACTION_NAME, title: text2imageTitle },
        kind: 'refactor',
        diagnostics: [],
        isAI: true
      })
    }

    return {
      dispose: () => 0,
      actions: actions
    }
  }

  async resolveCodeAction (codeAction: languages.CodeAction): Promise<Monaco.languages.CodeAction | undefined> {
    if (codeAction.command?.id) {
      state.enable = true

      ctx.action.getActionHandler(codeAction.command.id)?.()
    }

    codeAction.command = undefined

    return codeAction
  }
}
