import { ctx } from '@yank-note/runtime-api'
import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { globalCancelTokenSource, loading, state } from './core'
import { getAdapter } from './adapter'

export class CompletionProvider implements Monaco.languages.InlineCompletionsProvider {
  private logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CompletionProvider')

  freeInlineCompletions (): void {
    loading.value = false
  }

  handleItemDidShow (): void {
    loading.value = false
  }

  public async provideInlineCompletions (
    model: Monaco.editor.IModel,
    position: Monaco.Position,
    context: Monaco.languages.InlineCompletionContext,
    token: Monaco.CancellationToken
  ): Promise<Monaco.languages.InlineCompletions> {
    if (!state.enable) {
      return { items: [] }
    }

    globalCancelTokenSource.value = new (ctx.editor.getMonaco().CancellationTokenSource)(token)
    token = globalCancelTokenSource.value.token

    if (context.triggerKind === 0) { // auto trigger
      await ctx.utils.sleep(1500)
    }

    if (token.isCancellationRequested) {
      return { items: [] }
    }

    const cancelPromise = new Promise<Monaco.languages.InlineCompletions>((resolve) => {
      token.onCancellationRequested(() => {
        this.logger.debug('provideSuggestions', 'cancel')
        resolve({ items: [] })
      })
    })

    token.onCancellationRequested(() => {
      loading.value = false
    })

    try {
      loading.value = true
      const adapter = getAdapter('completion', state.adapter.completion)
      if (!adapter) {
        throw new Error(`No Completion adapter [${state.adapter.completion}]`)
      }

      const res = adapter.fetchCompletionResults(model, position, context, token)
      const result = await Promise.race([res, cancelPromise])

      if (token.isCancellationRequested) {
        return { items: [] }
      }

      return result
    } catch (error: any) {
      ctx.ui.useToast().show('warning', error.message || `${error}`, 5000)
      this.logger.error('provideSuggestions', 'error', error)
      throw error
    } finally {
      loading.value = false
    }
  }
}
