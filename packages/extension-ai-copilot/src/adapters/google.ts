import { CompletionAdapter, EditAdapter, Panel } from '@/adapter'
import { proxyRequest } from '@/core'
import { ctx } from '@yank-note/runtime-api'
import { Position, editor, languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { reactive, watch } from 'vue'

class BaseGoogleAIAdapter {
  description = 'Powered by <a target="_blank" href="https://ai.google.dev">GoogleAI</a>'
  private async _requestApi (model: string, token: string, body?: any) {
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${token}`

    const headers = {}
    if (body) {
      body = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    }

    const res = await proxyRequest(url, { headers, body: body, method: 'post' })
    return await res.json()
  }

  _parseJson (str: string, defaultValue?: any) {
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

  async request (
    model: string,
    apiToken: string,
    content: string,
    system: string,
    params: Record<string, any>
  ): Promise<string[]> {
    const contents: { role: 'user' | 'model', parts: [{ text: string }] }[] = []

    if (system) {
      contents.push({ role: 'user', parts: [{ text: system }] })
      contents.push({ role: 'model', parts: [{ text: 'ok' }] })
    }

    contents.push({ role: 'user', parts: [{ text: content }] })

    if (params.maxOutputTokens === -1) {
      delete params.maxOutputTokens
    }

    const body = { contents, generationConfig: params }

    const res = await this._requestApi(model, apiToken, body)

    if (!res.candidates) {
      ctx.ui.useToast().show('warning', JSON.stringify(res), 5000)
      return []
    }

    return (res.candidates).map((x: any) => {
      const text = x.content?.parts?.[0]?.text
      if (!text) {
        return null
      }

      return text
    }).filter(Boolean)
  }
}

export class GoogleAICompletionAdapter extends BaseGoogleAIAdapter implements CompletionAdapter {
  type: 'completion' = 'completion'
  id = 'google-ai-completion'
  displayname = 'GoogleAI'
  monaco = ctx.editor.getMonaco()
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.GoogleAICompletionAdapter')
  cursorPlaceholder = '{CURSOR}'
  defaultSystemMessage = `Fill content at the \`${this.cursorPlaceholder}\`. \n\nExample 1:\nInput: I like {CURSOR} dance with my hands\nOutput: dance\n\nExample 2:\nInput: I like dance with my {CURSOR}\nOutput: hands\n\nAttention: Only output the filled content, do not output the surrounding content.`

  private _state = reactive({
    prefix: '',
    suffix: '',
    systemMessage: this.defaultSystemMessage,
    model: 'gemini-pro',
    apiToken: '',
    maxOutputTokens: -1,
    temperature: 1,
    paramsJson: '{}',
  })

  panel: Panel = {
    type: 'form',
    items: [
      { type: 'prefix', key: 'prefix', label: 'Prefix', hasError: v => !v },
      { type: 'suffix', key: 'suffix', label: 'Suffix' },
      { type: 'input', key: 'apiToken', label: 'Api Token', props: { type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'model', label: 'Model', defaultValue: 'gemini-pro', props: { placeholder: 'e.g. gemini-pro' }, hasError: v => !v },
      { type: 'textarea', key: 'systemMessage', label: 'System Message', defaultValue: this.defaultSystemMessage },
      { type: 'range', key: 'maxOutputTokens', label: 'Max Tokens', max: 4096, min: -1, step: 1, description: '-1 means unlimited', defaultValue: -1 },
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

  activate (): { dispose: () => void, state: Record<string, any> } {
    const dispose = [
      watch(() => this._state.paramsJson, (json) => {
        const params = {
          maxOutputTokens: this._state.maxOutputTokens,
          temperature: this._state.temperature,
          ...this._parseJson(json),
        }

        this._state.maxOutputTokens = params.maxOutputTokens
        this._state.temperature = params.temperature
        this._state.paramsJson = JSON.stringify(params, null, 2)
      }),
      watch([
        () => this._state.maxOutputTokens,
        () => this._state.temperature,
      // eslint-disable-next-line camelcase
      ], ([maxOutputTokens, temperature]) => {
        const params = {
          ...this._parseJson(this._state.paramsJson, {}),
          maxOutputTokens,
          temperature,
        }

        this._state.paramsJson = JSON.stringify(params, null, 2)
      }, { immediate: true })
    ]

    return {
      state: this._state,
      dispose: () => {
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
    const system = this._state.systemMessage
    const params = this._parseJson(this._state.paramsJson, {})

    const result = await this.request(this._state.model, this._state.apiToken, content, system, params)
    const items = result.map((text) => ({ text: text, insertText: { snippet: text }, range, }))

    return { items }
  }
}

export class GoogleAIEditAdapter extends BaseGoogleAIAdapter implements EditAdapter {
  type: 'edit' = 'edit'
  id = 'google-ai-edit'
  displayname = 'GoogleAI'
  monaco = ctx.editor.getMonaco()
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.googleAIEditAdapter')
  defaultInstruction = 'Translate to English'
  defaultSystemMessage = 'Follow with the instruction and rewrite the text.\n\nExample 1: \nInstruction: Translate to English\nInput: 你好\nOutput: Hello\n\nExample 2: \nInstruction: Fix the grammar\nInput: I are a boy\nOutput: I am a boy\n\nAttention: Only output the rewritten content.'

  private _state = reactive({
    selection: '',
    systemMessage: this.defaultSystemMessage,
    historyInstructions: [] as string[],
    instruction: this.defaultInstruction,
    model: 'gemini-pro',
    apiToken: '',
    maxOutputTokens: -1,
    temperature: 1,
    paramsJson: '{}',
  })

  panel: Panel = {
    type: 'form',
    items: [
      { type: 'selection', key: 'selection', label: 'Selected Text', props: { readonly: true }, hasError: v => !v },
      { type: 'input', key: 'apiToken', label: 'Api Token', props: { type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'model', label: 'Model', defaultValue: 'gemini-pro', props: { placeholder: 'e.g. gemini-pro' }, hasError: v => !v },
      { type: 'textarea', key: 'instruction', label: 'Instruction', historyValueKey: 'historyInstructions', hasError: v => !v },
      { type: 'textarea', key: 'systemMessage', label: 'System Message', defaultValue: this.defaultSystemMessage },
      { type: 'range', key: 'maxOutputTokens', label: 'Max Tokens', max: 4096, min: -1, step: 1, description: '-1 means unlimited', defaultValue: -1 },
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

  activate (): { dispose: () => void, state: Record<string, any> } {
    const dispose = [
      watch(() => this._state.paramsJson, (json) => {
        const params = {
          maxOutputTokens: this._state.maxOutputTokens,
          temperature: this._state.temperature,
          ...this._parseJson(json),
        }

        this._state.maxOutputTokens = params.maxOutputTokens
        this._state.temperature = params.temperature
        this._state.paramsJson = JSON.stringify(params, null, 2)
      }),
      watch([
        () => this._state.maxOutputTokens,
        () => this._state.temperature,
      // eslint-disable-next-line camelcase
      ], ([maxOutputTokens, temperature]) => {
        const params = {
          ...this._parseJson(this._state.paramsJson, {}),
          maxOutputTokens,
          temperature,
        }

        this._state.paramsJson = JSON.stringify(params, null, 2)
      }, { immediate: true })
    ]

    return {
      state: this._state,
      dispose: () => {
        dispose.forEach((d) => d())
      }
    }
  }

  async fetchEditResults (selectedText: string): Promise<string | null | undefined> {
    if (!this._state.selection || !this._state.model) {
      return
    }

    const instruction = this._state.instruction
    if (!instruction) {
      return
    }

    this._state.historyInstructions.unshift(instruction)
    this._state.historyInstructions = ctx.lib.lodash.uniq(this._state.historyInstructions.slice(0, 10))

    const system = this._state.systemMessage + '\n\n' + 'Instruction: ' + instruction
    const content = selectedText
    const params = this._parseJson(this._state.paramsJson, {})

    const result = await this.request(this._state.model, this._state.apiToken, content, system, params)
    return result[0]
  }
}
