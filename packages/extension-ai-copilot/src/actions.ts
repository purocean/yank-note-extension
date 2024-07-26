import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { ctx } from '@yank-note/runtime-api'
import { EDIT_ACTION_NAME, TEXT_TO_IMAGE_ACTION_NAME, globalCancelTokenSource, i18n, loading, state } from './core'
import { getAdapter } from './adapter'
import { languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'

export async function executeEdit (token: Monaco.CancellationToken): Promise<boolean> {
  if (!state.enable) {
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
    const adapter = getAdapter('edit', state.adapter.edit)
    if (!adapter) {
      throw new Error(`No edit adapter [${state.adapter.edit}]`)
    }

    const instruction = adapter.state.instruction

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

    const selectedText = model.getValueInRange(ctx.editor.getEditor().getSelection()!) || ''

    const initSelectedRange = ctx.editor.getEditor().getSelection()!

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

    const res = adapter.fetchEditResults(selectedText, instruction, token, res => {
      if (model !== editor.getModel()) {
        throw new Error('Model changed, cancel editing.')
      }

      const prevContentCount = getLineCount(res.text, 0, res.text.length - res.delta.length)
      const deltaContentCount = getLineCount(res.delta, 0, res.delta.length)

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
        text: res.delta + '🚧',
      }])

      editor.revealRangeNearTopIfOutsideViewport(editRange)
    })

    const result = await Promise.race([res, cancelPromise])

    if (!result || token.isCancellationRequested || model !== editor.getModel()) {
      return false
    }

    editor.executeEdits('ai-copilot', [{
      range: getSelection(),
      text: result,
    }])

    editor.focus()
    return true
  } catch (error: any) {
    ctx.ui.useToast().show('warning', error.message || `${error}`, 5000)
    throw error
  } finally {
    loading.value = false
    const editor = ctx.editor.getEditor()
    const selection = editor.getSelection()
    if (selection) {
      editor.revealRangeNearTopIfOutsideViewport(selection.collapseToStart())
    }
  }
}

export async function executeTextToImage (token: Monaco.CancellationToken): Promise<false | Blob> {
  if (!state.enable) {
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

    const res = adapter.fetchTextToImageResults(instruction, token)

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
      ctx.action.getActionHandler(codeAction.command.id)?.()
    }

    return undefined
  }
}
