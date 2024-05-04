import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { ctx } from '@yank-note/runtime-api'
import { globalCancelTokenSource, i18n, loading, state } from './core'
import { getAdapter } from './adapter'
import { createWidget } from './ai-widget'

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
      throw new Error(`No Completion adapter [${state.adapter.edit}]`)
    }

    const editor = ctx.editor.getEditor()
    const model = editor.getModel()

    const selectedText = model?.getValueInRange(ctx.editor.getEditor().getSelection()!) || ''

    const initSelectedRange = ctx.editor.getEditor().getSelection()!

    const getEditRange = () => {
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

    const res = await adapter.fetchEditResults(selectedText, adapter.state.instruction, token, res => {
      let text = res.text

      const textLines = text.split('\n')
      const selectedTextLines = selectedText.split('\n')

      if (textLines.length < selectedTextLines.length) {
        text = textLines.join('\n') + '🚧\n' + selectedTextLines.slice(textLines.length).join('\n')
      } else {
        text += '🚧'
      }

      editor.executeEdits('ai-copilot', [{
        range: getEditRange(),
        text,
      }])
    })

    const result = await Promise.race([res, cancelPromise])

    if (!result || token.isCancellationRequested || model !== editor.getModel()) {
      return false
    }

    editor.executeEdits('ai-copilot', [{
      range: getEditRange(),
      text: result,
    }])
    editor.focus()
    return true
  } catch (error: any) {
    ctx.ui.useToast().show('warning', error.message || `${error}`, 5000)
    throw error
  } finally {
    loading.value = false
  }
}

export class CodeActionProvider implements Monaco.languages.CodeActionProvider {
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CodeActionProvider')

  provideCodeActions (_model: Monaco.editor.ITextModel, range: Monaco.Range): Monaco.languages.ProviderResult<Monaco.languages.CodeActionList> {
    if (!state.enable) {
      return { dispose: () => 0, actions: [] }
    }

    const editor = ctx.editor.getEditor()
    const selection = editor.getSelection()!
    const line = ctx.editor.getLineContent(selection.startLineNumber)
    console.error('xxx', line)

    return {
      dispose: () => 0,
      actions: [{
        title: range.isEmpty() ? i18n.t('ai-generate') : i18n.t('ai-edit'),
        kind: 'refactor',
        diagnostics: [],
        isPreferred: true,
      }]
    }
  }

  async resolveCodeAction (): Promise<Monaco.languages.CodeAction | undefined> {
    const editor = ctx.editor.getEditor()
    const selection = editor.getSelection()!

    createWidget(selection.isEmpty() ? 'generate' : 'edit')

    return undefined
  }
}
