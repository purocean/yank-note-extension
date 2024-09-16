import { ctx } from '@yank-note/runtime-api'
import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { globalCancelTokenSource, loading, state } from './core'
import { getAdapter } from './adapter'
import { widgetIsVisible } from './widget'

export class CompletionProvider implements Monaco.languages.InlineCompletionsProvider {
  private logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CompletionProvider')

  setLoading (val) {
    if (this.enabled()) {
      loading.value = val
    }
  }

  enabled () {
    return state.enable && !widgetIsVisible()
  }

  freeInlineCompletions (): void {
    this.setLoading(false)
  }

  handleItemDidShow (): void {
    this.setLoading(false)
  }

  public async provideInlineCompletions (
    model: Monaco.editor.IModel,
    position: Monaco.Position,
    context: Monaco.languages.InlineCompletionContext,
    token: Monaco.CancellationToken
  ): Promise<Monaco.languages.InlineCompletions> {
    if (!this.enabled()) {
      return { items: [] }
    }

    globalCancelTokenSource.value = new (ctx.editor.getMonaco().CancellationTokenSource)(token)
    token = globalCancelTokenSource.value.token

    if (context.triggerKind === 0) { // auto trigger
      const res = await new Promise<boolean>(resolve => {
        const timer = setTimeout(() => resolve(true), 1500)
        token.onCancellationRequested(() => {
          clearTimeout(timer)
          resolve(false)
        })
      })

      if (!res) {
        return { items: [] }
      }
    }

    if (!this.enabled()) {
      return { items: [] }
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
      this.setLoading(false)
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
      this.setLoading(false)
    }
  }
}
