import { CompletionAdapter, EditAdapter, Panel } from '@/adapter'
import { i18n, proxyFetch, COMPLETION_DEFAULT_SYSTEM_MESSAGE } from '@/core'
import { fetchEventSource, EventStreamContentType } from '@microsoft/fetch-event-source'
import { ctx } from '@yank-note/runtime-api'
import { CancellationToken, Position, editor, languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { reactive, watch } from 'vue'

const defaultApiUrl = 'https://api.openai.com/v1/chat/completions'

export class OpenAICompletionAdapter implements CompletionAdapter {
  type: 'completion' = 'completion'
  id = 'openai-completion'
  displayname = 'OpenAI'
  description = 'Powered by <a target="_blank" href="http://openai.com">OpenAI</a>'
  supportProxy = true
  monaco = ctx.editor.getMonaco()
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.OpenAICompletionAdapter')
  defaultSystemMessage = COMPLETION_DEFAULT_SYSTEM_MESSAGE

  state = reactive({
    api_url: defaultApiUrl,
    context: '',
    system_message: this.defaultSystemMessage,
    model: 'gpt-3.5-turbo',
    api_token: '',
    max_tokens: -1,
    temperature: 1,
    paramsJson: '{}',
  })

  panel: Panel = {
    type: 'form',
    items: [
      { type: 'context', key: 'context', label: i18n.t('context'), hasError: v => !v },
      { type: 'input', key: 'api_token', label: i18n.t('api-token'), props: { placeholder: 'sk-xxx', type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'model', label: i18n.t('model'), defaultValue: 'gpt-3.5-turbo', props: { placeholder: 'e.g. gpt-4 or gpt-3.5-turbo' }, hasError: v => !v },
      { type: 'textarea', key: 'system_message', label: i18n.t('system-message'), defaultValue: this.defaultSystemMessage },
      { type: 'range', key: 'max_tokens', label: 'Max Tokens', max: 4096, min: -1, step: 1, description: '-1 means unlimited', defaultValue: -1 },
      { type: 'range', key: 'temperature', label: 'Temperature', max: 2, min: 0, step: 0.01, defaultValue: 1 },
      { type: 'input', key: 'api_url', label: 'Api Url', defaultValue: defaultApiUrl, props: { placeholder: 'https://' }, hasError: v => !v },
      {
        type: 'textarea',
        key: 'paramsJson',
        label: 'Params',
        hasError: (val) => {
          try {
            JSON.parse(val)
            return false
          } catch (error) {
            return true
          }
        }
      },

    ],
  }

  private _parseJson (str: string, defaultValue?: any) {
    try {
      return JSON.parse(str)
    } catch (error) {
      if (defaultValue) {
        return defaultValue
      } else {
        throw error
      }
    }
  }

  private async _requestApi (url: string, body?: any) {
    const token = this.state.api_token

    const headers = { Authorization: `Bearer ${token}` }

    if (body) {
      body = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    }

    const res = await proxyFetch(url, { headers, body: body, method: 'post' })
    return await res.json()
  }

  activate (): { dispose: () => void, state: Record<string, any> } {
    const dispose = [
      watch(() => this.state.paramsJson, (json) => {
        const params = {
          model: this.state.model,
          max_tokens: this.state.max_tokens,
          temperature: this.state.temperature,
          ...this._parseJson(json),
        }

        this.state.model = params.model
        this.state.max_tokens = params.max_tokens
        this.state.temperature = params.temperature
        this.state.paramsJson = JSON.stringify(params, null, 2)
      }),
      watch([
        () => this.state.model,
        () => this.state.max_tokens,
        () => this.state.temperature,
      // eslint-disable-next-line camelcase
      ], ([model, max_tokens, temperature]) => {
        const params = {
          ...this._parseJson(this.state.paramsJson, {}),
          model,
          max_tokens,
          temperature,
        }

        this.state.paramsJson = JSON.stringify(params, null, 2)
      }, { immediate: true })
    ]

    return {
      state: this.state,
      dispose: () => {
        this.logger.debug('dispose')
        dispose.forEach((d) => d())
      }
    }
  }

  async fetchCompletionResults (_model: editor.ITextModel, position: Position, context: languages.InlineCompletionContext): Promise<languages.InlineCompletions> {
    if (context.triggerKind !== this.monaco.languages.InlineCompletionTriggerKind.Explicit) {
      return { items: [] }
    }

    const range = new this.monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    )

    if (!this.state.context || !this.state.model) {
      return { items: [] }
    }

    const content = this.state.context
    const system = this.state.system_message

    const messages = [
      { role: 'user', content }
    ]

    if (system) {
      messages.unshift({ role: 'system', content: system })
    }

    const url = this.state.api_url || defaultApiUrl

    const params = this._parseJson(this.state.paramsJson, {})

    if (params.max_tokens === -1) {
      delete params.max_tokens
    }

    const body = { messages, ...params }

    this.logger.debug('provideSuggestions', 'request', body)
    const res = await this._requestApi(url, body)
    this.logger.debug('provideSuggestions', 'result', res)

    if (!res.choices) {
      ctx.ui.useToast().show('warning', JSON.stringify(res), 5000)
      return { items: [] }
    }

    const items = (res.choices).map((x: any) => {
      const text = x.message ? x.message.content : x.text
      return { text: text, insertText: { snippet: text }, range, }
    })

    return { items }
  }
}

export class OpenAIEditAdapter implements EditAdapter {
  type: 'edit' = 'edit'
  id = 'openai-edit'
  displayname = 'OpenAI'
  description = 'Powered by <a target="_blank" href="http://openai.com">OpenAI</a>'
  supportProxy = true
  monaco = ctx.editor.getMonaco()
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.OpenAIEditAdapter')
  defaultInstruction = 'Translate to English'
  defaultSystemMessage = 'Generate/Modify content based on the CONTEXT at the {CURSOR} position.\n--CONTEXT BEGIN--\n{CONTEXT}\n--CONTEXT END--\n\nAttention: Output the content directly, no surrounding content.'

  state = reactive({
    withContext: true,
    context: '',
    api_url: defaultApiUrl,
    selection: '',
    systemMessageV2: this.defaultSystemMessage,
    instruction: this.defaultInstruction,
    model: 'gpt-3.5-turbo',
    api_token: '',
    max_tokens: -1,
    temperature: 1,
    paramsJson: '{}',
  })

  panel: Panel = {
    type: 'form',
    items: [
      { type: 'selection', key: 'selection', label: i18n.t('selected-text'), props: { readonly: true } },
      { type: 'context', key: 'context', label: i18n.t('context') },
      { type: 'instruction', key: 'instruction', label: i18n.t('instruction'), hasError: v => !v },
      { type: 'input', key: 'api_token', label: i18n.t('api-token'), props: { placeholder: 'sk-xxx', type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'model', label: i18n.t('model'), defaultValue: 'gpt-3.5-turbo', props: { placeholder: 'e.g. gpt-4 or gpt-3.5-turbo' }, hasError: v => !v },
      { type: 'textarea', key: 'systemMessageV2', label: i18n.t('system-message'), defaultValue: this.defaultSystemMessage },
      { type: 'range', key: 'max_tokens', label: 'Max Tokens', max: 4096, min: -1, step: 1, description: '-1 means unlimited', defaultValue: -1 },
      { type: 'range', key: 'temperature', label: 'Temperature', max: 2, min: 0, step: 0.01, defaultValue: 1 },
      { type: 'input', key: 'api_url', label: 'Api Url', defaultValue: defaultApiUrl, props: { placeholder: 'https://' }, hasError: v => !v },
      {
        type: 'textarea',
        key: 'paramsJson',
        label: 'Params',
        hasError: (val) => {
          try {
            JSON.parse(val)
            return false
          } catch (error) {
            return true
          }
        }
      },
    ],
  }

  private _parseJson (str: string, defaultValue?: any) {
    try {
      return JSON.parse(str)
    } catch (error) {
      if (defaultValue) {
        return defaultValue
      } else {
        throw error
      }
    }
  }

  private async _requestApi (url: string, body: any, cancelToken: CancellationToken, onProgress: (text: string) => void): Promise<string> {
    const token = this.state.api_token

    const headers = { Authorization: `Bearer ${token}` }

    if (body) {
      body = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    }

    const controller = new AbortController()
    const { signal } = controller

    cancelToken?.onCancellationRequested(() => {
      controller.abort()
    })

    let text = ''

    class FatalError extends Error { }

    await fetchEventSource(url, {
      fetch: () => proxyFetch(url, { sse: true, headers, body: body, method: 'post' }, signal),
      async onopen (response) {
        if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
          return
        }

        if (response.headers.get('content-type')?.includes('application/json')) {
          const text = await response.text()
          throw new Error(text)
        } else {
          throw new Error(response.statusText)
        }
      },
      onmessage: (e) => {
        const data = e.data
        if (data.includes('[DONE]')) {
          throw new FatalError('DONE')
        }

        const res = JSON.parse(data)
        if (!res.choices[0]?.delta) {
          console.error(res)
          ctx.ui.useToast().show('warning', JSON.stringify(res), 5000)
        } else {
          const val = res.choices[0].delta.content
          if (val) {
            text += val
            onProgress(text)
          }
        }
      },
      onclose: () => {
        throw new FatalError('CLOSED')
        // controller.abort()
      },
      onerror: (err) => {
        if (err instanceof FatalError) {
          throw err
        } else {
          console.error(err)
          ctx.ui.useToast().show('warning', err.message, 5000)
          throw new FatalError(err.message)
        }
      }
    }).catch(e => {
      if (e instanceof FatalError) {
        return
      }

      console.error(e)
      throw e
    })

    return text
  }

  activate (): { dispose: () => void, state: Record<string, any> } {
    const dispose = [
      watch(() => this.state.paramsJson, (json) => {
        const params = {
          model: this.state.model,
          max_tokens: this.state.max_tokens,
          temperature: this.state.temperature,
          ...this._parseJson(json),
        }

        this.state.model = params.model
        this.state.max_tokens = params.max_tokens
        this.state.temperature = params.temperature
        this.state.paramsJson = JSON.stringify(params, null, 2)
      }),
      watch([
        () => this.state.model,
        () => this.state.max_tokens,
        () => this.state.temperature,
      // eslint-disable-next-line camelcase
      ], ([model, max_tokens, temperature]) => {
        const params = {
          ...this._parseJson(this.state.paramsJson, {}),
          model,
          max_tokens,
          temperature,
        }

        this.state.paramsJson = JSON.stringify(params, null, 2)
      }, { immediate: true })
    ]

    return {
      state: this.state,
      dispose: () => {
        this.logger.debug('dispose')
        dispose.forEach((d) => d())
      }
    }
  }

  async fetchEditResults (selectedText: string, instruction: string, token: CancellationToken, onProgress: (res: { text: string }) => void): Promise<string | null | undefined> {
    if (!this.state.model) {
      return
    }

    const system = this.buildSystem(this.state.systemMessageV2, this.state.context)

    if (!instruction) {
      return
    }

    this.state.instruction = instruction

    const messages = selectedText ? [{ role: 'user', content: selectedText }] : []

    messages.unshift({ role: 'user', content: 'Instruction: ' + instruction })

    if (system) {
      messages.unshift({ role: 'system', content: system })
    }

    const url = this.state.api_url || defaultApiUrl

    const params = this._parseJson(this.state.paramsJson, {})

    if (params.max_tokens === -1) {
      delete params.max_tokens
    }

    const body = { messages, ...params, stream: true }

    this.logger.debug('fetchEditResults', 'request', body)
    const text = await this._requestApi(url, body, token, text => {
      onProgress({ text })
    })

    this.logger.debug('fetchEditResults', 'result', text)

    return text || null
  }

  buildSystem (prompt: string, context: string) {
    if (!this.state.withContext) {
      return ''
    }

    return context.trim() ? prompt.replace('{CONTEXT}', context) : ''
  }
}
