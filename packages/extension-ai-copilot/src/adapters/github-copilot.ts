import { reactive } from 'vue'
import { CompletionAdapter, Panel } from '@/lib/adapter'
import type { CancellationToken, Position, editor, languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { state } from '@/lib/core'
import { ctx } from '@yank-note/runtime-api'

export class GithubCopilotCompletionAdapter implements CompletionAdapter {
  type: 'completion' = 'completion'
  id = 'github-copilot-completion'
  displayname = 'Github Copilot'
  description = 'Please refer to <a target="_blank" href="https://blog-purocean.vercel.app/hack-github-copilot/">this article</a> for details.'
  defaultApiPoint = 'http://127.0.0.1:3223/calculateInlineCompletions'
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.GithubCopilotCompletionAdapter')

  monaco = ctx.editor.getMonaco()

  state = reactive({
    context: '',
    apiPoint: this.defaultApiPoint,
    autoTrigger: true,
  })

  panel: Panel = {
    type: 'form',
    items: [
      { type: 'input', key: 'apiPoint', label: 'Api Point', defaultValue: this.defaultApiPoint, props: { placeholder: this.defaultApiPoint }, hasError: v => !v },
      { type: 'checkbox', key: 'autoTrigger', label: 'Auto Trigger', description: 'Auto trigger completion when typing', defaultValue: true },
    ],
  }

  activate (): { dispose: () => void, state: Record<string, any> } {
    return {
      state: this.state,
      dispose: () => {
        this.logger.debug('dispose')
      }
    }
  }

  async fetchCompletionResults (_model: editor.ITextModel, position: Position, context: languages.InlineCompletionContext, cancelToken: CancellationToken): Promise<languages.InlineCompletions> {
    if (!state.enable || !this.state.apiPoint) {
      return { items: [] }
    }

    // Only trigger when the triggerKind is Explicit if autoTrigger is disabled
    if (!this.state.autoTrigger && context.triggerKind !== this.monaco.languages.InlineCompletionTriggerKind.Explicit) {
      return { items: [] }
    }

    const content = ctx.editor.getValue()
    if (content.length > 1024 * 512 || content.length < 4) {
      return { items: [] }
    }

    return {
      items: await this.provideSuggestions(content, position, context, cancelToken)
    }
  }

  async provideSuggestions (content: string, position: Position, context: languages.InlineCompletionContext, token: CancellationToken) {
    if (token.isCancellationRequested) {
      return []
    }

    const headers = { 'Content-Type': 'application/json' }
    const body = JSON.stringify({
      language: 'markdown',
      content,
      triggerKind: context.triggerKind,
      line: position.lineNumber - 1,
      column: position.column - 1,
    })

    const x = await ctx.api.proxyFetch(
      this.state.apiPoint,
      { headers, body: body, method: 'post' },
    )

    const res = await x.json()

    if (res && res.message) {
      throw new Error(res.message)
    }

    if (token.isCancellationRequested) {
      return []
    }

    if (!res || res.type !== 'success' || !res.items) {
      return []
    }

    const monaco = ctx.editor.getMonaco()

    return res.items.map(x => {
      const range = new monaco.Range(
        x.range[0].line + 1,
        x.range[0].character + 1,
        x.range[1].line + 1,
        x.range[1].character + 1,
      )

      return {
        text: x.displayText,
        insertText: { snippet: x.insertText },
        range,
      }
    })
  }
}
