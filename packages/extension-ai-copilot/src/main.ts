import { App, createApp } from 'vue'
import { ctx, registerPlugin } from '@yank-note/runtime-api'
import Monaco, { languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { COMPLETION_ACTION_NAME, EDIT_ACTION_NAME, globalCancelTokenSource, i18n, loading, state } from './core'
import AIPanel from './AIPanel.vue'
import { getAdapter, registerAdapter } from './adapter'
import { OpenAICompletionAdapter, OpenAIEditAdapter } from './adapters/openai'
import { GoogleAICompletionAdapter, GoogleAIEditAdapter } from './adapters/google'
import { GithubCopilotCompletionAdapter } from './adapters/github-copilot'

const { getLogger } = ctx.utils

const extensionId = __EXTENSION_ID__

class CompletionProvider implements Monaco.languages.InlineCompletionsProvider {
  private logger = getLogger(extensionId + '.CompletionProvider')

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

class CodeActionProvider implements Monaco.languages.CodeActionProvider {
  logger = getLogger(extensionId + '.CodeActionProvider')

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

  async resolveCodeAction (_codeAction: Monaco.languages.CodeAction, token: Monaco.CancellationToken): Promise<Monaco.languages.CodeAction | undefined> {
    await CodeActionProvider.executeEdit(token)
    return undefined
  }

  static async executeEdit (token: Monaco.CancellationToken) {
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

      const res = await adapter.fetchEditResults(selectedText, token)
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
}

registerPlugin({
  name: extensionId,
  register (ctx) {
    registerAdapter(new OpenAICompletionAdapter())
    registerAdapter(new OpenAIEditAdapter())
    registerAdapter(new GoogleAICompletionAdapter())
    registerAdapter(new GoogleAIEditAdapter())
    registerAdapter(new GithubCopilotCompletionAdapter())

    ctx.editor.whenEditorReady().then(({ monaco }) => {
      monaco.languages.registerInlineCompletionsProvider('markdown', new CompletionProvider())
      monaco.languages.registerCodeActionProvider('markdown', new CodeActionProvider())
    })

    ctx.action.registerAction({
      name: COMPLETION_ACTION_NAME,
      keys: [ctx.keybinding.CtrlCmd, ctx.keybinding.Alt, 'Period'],
      description: i18n.t('ai-complete'),
      forUser: true,
      handler: async () => {
        state.type = 'completion'
        await ctx.utils.sleep(0)
        ctx.editor.getEditor().getAction('editor.action.inlineSuggest.trigger')?.run()
        ctx.editor.getEditor().focus()
      },
      when: () => ctx.store.state.showEditor && !ctx.store.state.presentation,
    })

    ctx.action.registerAction({
      name: EDIT_ACTION_NAME,
      description: i18n.t('ai-edit'),
      forUser: true,
      handler: async () => {
        state.type = 'edit'
        await ctx.utils.sleep(0)
        const cancelTokenSource = new (ctx.editor.getMonaco().CancellationTokenSource)()
        CodeActionProvider.executeEdit(cancelTokenSource.token)
      },
      when: () => ctx.store.state.showEditor && !ctx.store.state.presentation,
    })

    ctx.statusBar.tapMenus((menus) => {
      if (!ctx.store.state.showEditor || ctx.store.state.presentation) {
        return
      }

      menus['status-bar-tool']?.list?.push(
        {
          id: __EXTENSION_ID__,
          type: 'normal',
          title: i18n.t('enable-ai-copilot'),
          checked: state.enable,
          onClick: () => {
            state.enable = !state.enable
          },
        },
      )
    })

    const div = document.createElement('div')
    div.className = 'ai-panel-container'
    div.style.position = 'absolute'
    div.style.right = '3%'
    div.style.bottom = '20px'
    div.style.zIndex = '2048'
    div.style.maxWidth = '85%'
    document.querySelector('.editor-container')!.appendChild(div)

    let panel: App | null = null

    ctx.lib.vue.watch(() => state.enable, (val) => {
      ctx.statusBar.refreshMenu()

      if (val) {
        div.style.display = 'block'
        panel = createApp(AIPanel)
        panel.mount(div)
      } else {
        div.style.display = 'none'
        panel?.unmount()
        panel = null
      }
    }, { immediate: true })
  }
})
