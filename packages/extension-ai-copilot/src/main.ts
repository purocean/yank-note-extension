import { App, createApp } from 'vue'
import { registerPlugin } from '@yank-note/runtime-api'
import { COMPLETION_ACTION_NAME, EDIT_ACTION_NAME, TEXT_TO_IMAGE_ACTION_NAME, i18n, loading, proxyFetch, state } from './core'
import AIPanel from './AIPanel.vue'
import { registerAdapter } from './adapter'
import { OpenAICompletionAdapter, OpenAIEditAdapter } from './adapters/openai'
import { GoogleAICompletionAdapter, GoogleAIEditAdapter } from './adapters/google'
import { GithubCopilotCompletionAdapter } from './adapters/github-copilot'
import { createWidget, disposeWidget } from './ai-widget'
import { CompletionProvider } from './completion'
import { CodeActionProvider } from './actions'

import './index.scss'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    registerAdapter(new OpenAICompletionAdapter())
    registerAdapter(new OpenAIEditAdapter())
    registerAdapter(new GoogleAICompletionAdapter())
    registerAdapter(new GoogleAIEditAdapter())
    registerAdapter(new GithubCopilotCompletionAdapter())

    ctx.editor.whenEditorReady().then(({ monaco }) => {
      monaco.languages.registerInlineCompletionsProvider('*', new CompletionProvider())
      monaco.languages.registerCodeActionProvider('*', new CodeActionProvider())
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
      when: () => state.enable && ctx.store.state.showEditor && !ctx.store.state.presentation,
    })

    ctx.action.registerAction({
      name: EDIT_ACTION_NAME,
      description: i18n.t('ai-edit-or-gen'),
      forUser: true,
      handler: async (runImmediately = false) => {
        const editor = ctx.editor.getEditor()
        const selection = editor.getSelection()!
        createWidget(selection.isEmpty() ? 'generate' : 'edit', runImmediately)
      },
      when: () => state.enable && ctx.store.state.showEditor && !ctx.store.state.presentation,
    })

    ctx.action.registerAction({
      name: TEXT_TO_IMAGE_ACTION_NAME,
      description: i18n.t('ai-text-to-image'),
      forUser: true,
      handler: async (runImmediately = false) => {
        createWidget('text2image', runImmediately)
      },
      when: () => state.enable && ctx.store.state.showEditor && !ctx.store.state.presentation,
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

        disposeWidget()
      }
    }, { immediate: true })

    return {
      registerAdapter,
      state,
      proxyFetch,
      loading,
    }
  }
})
