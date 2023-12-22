import { CompletionAdapter, EditAdapter, Panel } from '@/adapter'
import { proxyRequest } from '@/core'
import { ctx } from '@yank-note/runtime-api'
import { Position, editor, languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { reactive, watch } from 'vue'

export class OpenAICompletionAdapter implements CompletionAdapter {
  type: 'completion' = 'completion'
  id = 'openai-completion'
  displayname = 'OpenAI'
  description = 'Powered by <a target="_blank" href="http://openai.com">OpenAI</a>'
  monaco = ctx.editor.getMonaco()
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.OpenAICompletionAdapter')
  cursorPlaceholder = '{CURSOR}'
  defaultSystemMessage = `Fill content at the \`${this.cursorPlaceholder}\`. \n\nExample 1:\nInput: I like {CURSOR} dance with my hands\nOutput: dance\n\nExample 2:\nInput: I like dance with my {CURSOR}\nOutput: hands\n\nAttention: Only output the filled content, do not output the surrounding content.`

  private _state = reactive({
    prefix: '',
    suffix: '',
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
      { type: 'prefix', key: 'prefix', label: 'Prefix', hasError: v => !v },
      { type: 'suffix', key: 'suffix', label: 'Suffix' },
      { type: 'input', key: 'api_token', label: 'Api Token', props: { placeholder: 'sk-xxx', type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'model', label: 'Model', defaultValue: 'gpt-3.5-turbo', props: { placeholder: 'e.g. gpt-4 or gpt-3.5-turbo' }, hasError: v => !v },
      { type: 'textarea', key: 'system_message', label: 'System Message', defaultValue: this.defaultSystemMessage },
      { type: 'range', key: 'max_tokens', label: 'Max Tokens', max: 4096, min: -1, step: 1, description: '-1 means unlimited', defaultValue: -1 },
      { type: 'range', key: 'temperature', label: 'Temperature', max: 2, min: 0, step: 0.01, defaultValue: 1 },
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
    const token = this._state.api_token

    const headers = { Authorization: `Bearer ${token}` }

    if (body) {
      body = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    }

    const res = await proxyRequest(url, { headers, body: body, method: 'post' })
    return await res.json()
  }

  activate (): { dispose: () => void, state: Record<string, any> } {
    const dispose = [
      watch(() => this._state.paramsJson, (json) => {
        const params = {
          model: this._state.model,
          max_tokens: this._state.max_tokens,
          temperature: this._state.temperature,
          ...this._parseJson(json),
        }

        this._state.model = params.model
        this._state.max_tokens = params.max_tokens
        this._state.temperature = params.temperature
        this._state.paramsJson = JSON.stringify(params, null, 2)
      }),
      watch([
        () => this._state.model,
        () => this._state.max_tokens,
        () => this._state.temperature,
      // eslint-disable-next-line camelcase
      ], ([model, max_tokens, temperature]) => {
        const params = {
          ...this._parseJson(this._state.paramsJson, {}),
          model,
          max_tokens,
          temperature,
        }

        this._state.paramsJson = JSON.stringify(params, null, 2)
      }, { immediate: true })
    ]

    return {
      state: this._state,
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

    if (!this._state.prefix || !this._state.model) {
      return { items: [] }
    }

    const content = `${this._state.prefix}${this.cursorPlaceholder}${this._state.suffix}`
    const system = this._state.system_message

    const messages = [
      { role: 'user', content }
    ]

    if (system) {
      messages.unshift({ role: 'system', content: system })
    }

    const url = 'https://api.openai.com/v1/chat/completions'

    const params = this._parseJson(this._state.paramsJson, {})

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
  monaco = ctx.editor.getMonaco()
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.OpenAIEditAdapter')
  defaultInstruction = 'Translate to English'
  defaultSystemMessage = 'Follow with the instruction and rewrite the text.\n\nExample 1: \nInstruction: Translate to English\nInput: 你好\nOutput: Hello\n\nExample 2: \nInstruction: Fix the grammar\nInput: I are a boy\nOutput: I am a boy\n\nAttention: Only output the rewritten content.'

  state = reactive({
    selection: '',
    system_message: this.defaultSystemMessage,
    historyInstructions: [] as string[],
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
      { type: 'selection', key: 'selection', label: 'Selected Text', props: { readonly: true }, hasError: v => !v },
      { type: 'instruction', key: 'instruction', label: 'Instruction', historyValueKey: 'historyInstructions', hasError: v => !v },
      { type: 'input', key: 'api_token', label: 'Api Token', props: { placeholder: 'sk-xxx', type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'model', label: 'Model', defaultValue: 'gpt-3.5-turbo', props: { placeholder: 'e.g. gpt-4 or gpt-3.5-turbo' }, hasError: v => !v },
      { type: 'textarea', key: 'system_message', label: 'System Message', defaultValue: this.defaultSystemMessage },
      { type: 'range', key: 'max_tokens', label: 'Max Tokens', max: 4096, min: -1, step: 1, description: '-1 means unlimited', defaultValue: -1 },
      { type: 'range', key: 'temperature', label: 'Temperature', max: 2, min: 0, step: 0.01, defaultValue: 1 },
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

    const res = await proxyRequest(url, { headers, body: body, method: 'post' })
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

  async fetchEditResults (selectedText: string, instruction: string): Promise<string | null | undefined> {
    if (!this.state.selection || !this.state.model) {
      return
    }

    const system = this.state.system_message

    if (!instruction) {
      return
    }

    this.state.instruction = instruction

    this.state.historyInstructions.unshift(instruction)
    this.state.historyInstructions = ctx.lib.lodash.uniq(this.state.historyInstructions.slice(0, 10))

    const messages = [{ role: 'user', content: selectedText }]

    messages.unshift({ role: 'user', content: 'Instruction: ' + instruction })

    if (system) {
      messages.unshift({ role: 'system', content: system })
    }

    const url = 'https://api.openai.com/v1/chat/completions'

    const params = this._parseJson(this.state.paramsJson, {})

    if (params.max_tokens === -1) {
      delete params.max_tokens
    }

    const body = { messages, ...params }

    this.logger.debug('fetchEditResults', 'request', body)
    const res = await this._requestApi(url, body)
    this.logger.debug('fetchEditResults', 'result', res)

    if (!res.choices || res.choices.length === 0) {
      ctx.ui.useToast().show('warning', JSON.stringify(res), 5000)
      return
    }

    const items = (res.choices).map((x: any) => {
      const text = x.message ? x.message.content : x.text
      return { text: text }
    })

    return items[0].text
  }
}
