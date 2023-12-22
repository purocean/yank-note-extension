import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { ctx } from '@yank-note/runtime-api'
import { globalCancelTokenSource, i18n, loading, state } from './core'
import { getAdapter } from './adapter'
import { createWidget } from './ai-widget'

export async function executeEdit (token: Monaco.CancellationToken) {
  if (!state.enable) {
    return
  }

  globalCancelTokenSource.value = new (ctx.editor.getMonaco().CancellationTokenSource)(token)
  token = globalCancelTokenSource.value.token

  if (token.isCancellationRequested) {
    return
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

    const selectedText = model?.getValueInRange(ctx.editor.getEditor().getSelection()!)

    if (!selectedText) {
      return
    }

    const res = await adapter.fetchEditResults(selectedText, adapter.state.instruction, token)
    const result = await Promise.race([res, cancelPromise])

    if (!result || token.isCancellationRequested || model !== editor.getModel()) {
      return
    }

    editor.executeEdits('ai-copilot', [{
      range: ctx.editor.getEditor().getSelection()!,
      text: result,
    }])
    editor.focus()
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

    return {
      dispose: () => 0,
      actions: range.isEmpty()
        ? []
        : [{
            title: i18n.t('ai-edit'),
            kind: 'refactor',
            diagnostics: [],
            isPreferred: true,
          }]
    }
  }

  async resolveCodeAction (): Promise<Monaco.languages.CodeAction | undefined> {
    createWidget()

    return undefined
  }
}
