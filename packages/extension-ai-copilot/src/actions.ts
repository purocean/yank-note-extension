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

    const res = adapter.fetchEditResults(selectedText, instruction, token, res => {
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

  provideCodeActions (_model: Monaco.editor.ITextModel, range: Monaco.Range): Monaco.languages.ProviderResult<Monaco.languages.CodeActionList> {
    if (!state.enable) {
      return { dispose: () => 0, actions: [] }
    }

    const editTitle = range.isEmpty() ? i18n.t('ai-generate') : i18n.t('ai-edit')
    const text2imageTitle = i18n.t('ai-text-to-image')

    return {
      dispose: () => 0,
      actions: [
        {
          title: editTitle,
          command: { id: EDIT_ACTION_NAME, title: editTitle },
          kind: 'refactor',
          diagnostics: [],
          isPreferred: true,
          isAI: true
        },
        {
          title: text2imageTitle,
          isAI: true,
          command: {
            id: TEXT_TO_IMAGE_ACTION_NAME,
            title: text2imageTitle
          },
          kind: 'refactor',
          diagnostics: [],
        }
      ]
    }
  }

  async resolveCodeAction (codeAction: languages.CodeAction): Promise<Monaco.languages.CodeAction | undefined> {
    if (codeAction.command?.id) {
      ctx.action.getActionHandler(codeAction.command.id)?.()
    }

    return undefined
  }
}
