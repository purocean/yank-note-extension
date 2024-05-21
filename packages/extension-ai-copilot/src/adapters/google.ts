import { CompletionAdapter, EditAdapter, Panel } from '@/adapter'
import { i18n, CURSOR_PLACEHOLDER, proxyFetch, readReader } from '@/core'
import { ctx } from '@yank-note/runtime-api'
import { Position, editor, languages, CancellationToken } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { reactive, watch } from 'vue'

class BaseGoogleAIAdapter {
  description = 'Powered by <a target="_blank" href="https://ai.google.dev">GoogleAI</a>'
  supportProxy = true
  private async _requestApi (model: string, token: string, body?: any, onProgress?: ((text: string) => void), cancelToken?: CancellationToken): Promise<string> {
    const url = onProgress
      ? `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?alt=sse&key=${token}`
      : `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${token}`

    const headers = {}
    if (body) {
      body = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    }

    const controller = new AbortController()
    const { signal } = controller

    cancelToken?.onCancellationRequested(() => {
      controller.abort()
    })

    if (onProgress) {
      const res = await proxyFetch(url, { headers, body: body, method: 'post', sse: true }, signal)
      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error('No reader')
      }

      let text = ''
      let hasError = false

      const result = await readReader(reader, (line) => {
        if (hasError) {
          return
        }

        const json = line.replace('data:', '').trim()
        if (json) {
          try {
            const res = JSON.parse(json)
            const val = res.candidates[0].content?.parts?.[0]?.text
            if (val) {
              text += val
              onProgress(text)
            }
          } catch (err) {
            hasError = true
          }
        }
      })

      if (hasError) {
        const res = JSON.parse(result)
        console.error(res)
        ctx.ui.useToast().show('warning', JSON.stringify(res), 5000)
        return ''
      }

      return text
    } else {
      const result = await proxyFetch(url, { headers, body: body, method: 'post' })
      const res = await result.json()

      if (!res.candidates) {
        ctx.ui.useToast().show('warning', JSON.stringify(res), 5000)
        return ''
      }

      return res.candidates[0].content?.parts?.[0]?.text
    }
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
    params: Record<string, any>,
    onProgress?: (text: string) => void,
    cancelToken?: CancellationToken
  ): Promise<string | null> {
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

    const res = this._requestApi(model, apiToken, body, onProgress, cancelToken)
    return res || null
  }
}

export class GoogleAICompletionAdapter extends BaseGoogleAIAdapter implements CompletionAdapter {
  type: 'completion' = 'completion'
  id = 'google-ai-completion'
  displayname = 'GoogleAI'
  monaco = ctx.editor.getMonaco()
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.GoogleAICompletionAdapter')
  defaultSystemMessage = `Fill content at the \`${CURSOR_PLACEHOLDER}\`. \n\nExample 1:\nInput: I like {CURSOR} dance with my hands\nOutput: dance\n\nExample 2:\nInput: I like dance with my {CURSOR}\nOutput: hands\n\nAttention: Only output the filled content, do not output the surrounding content.`

  state = reactive({
    context: '',
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
      { type: 'context', key: 'context', label: i18n.t('context'), hasError: v => !v },
      { type: 'input', key: 'apiToken', label: i18n.t('api-token'), props: { type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'model', label: i18n.t('model'), defaultValue: 'gemini-pro', props: { placeholder: 'e.g. gemini-pro' }, hasError: v => !v },
      { type: 'textarea', key: 'systemMessage', label: i18n.t('system-message'), defaultValue: this.defaultSystemMessage },
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
      watch(() => this.state.paramsJson, (json) => {
        const params = {
          maxOutputTokens: this.state.maxOutputTokens,
          temperature: this.state.temperature,
          ...this._parseJson(json),
        }

        this.state.maxOutputTokens = params.maxOutputTokens
        this.state.temperature = params.temperature
        this.state.paramsJson = JSON.stringify(params, null, 2)
      }),
      watch([
        () => this.state.maxOutputTokens,
        () => this.state.temperature,
      // eslint-disable-next-line camelcase
      ], ([maxOutputTokens, temperature]) => {
        const params = {
          ...this._parseJson(this.state.paramsJson, {}),
          maxOutputTokens,
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

    if (!this.state.context) {
      return { items: [] }
    }

    const content = this.state.context
    const system = this.state.systemMessage
    const params = this._parseJson(this.state.paramsJson, {})

    const result = await this.request(this.state.model, this.state.apiToken, content, system, params)
    const items = result ? [{ text: result, insertText: { snippet: result }, range }] : []

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
  defaultSystemMessage = 'Generate/Modify content based on the context at the {CURSOR} position.\n--CONTEXT BEGIN--\n{CONTEXT}\n--CONTEXT END--\n\nAttention: Output the content directly, no surrounding content.'

  state = reactive({
    withContext: true,
    selection: '',
    context: '',
    instruction: this.defaultInstruction,
    systemMessageV2: this.defaultSystemMessage,
    model: 'gemini-pro',
    apiToken: '',
    maxOutputTokens: -1,
    temperature: 0.5,
    paramsJson: '{}',
  })

  panel: Panel = {
    type: 'form',
    items: [
      { type: 'selection', key: 'selection', label: i18n.t('selected-text'), props: { readonly: true } },
      { type: 'context', key: 'context', label: i18n.t('context') },
      { type: 'instruction', key: 'instruction', label: i18n.t('instruction'), hasError: v => !v },
      { type: 'textarea', key: 'systemMessageV2', label: i18n.t('system-message'), defaultValue: this.defaultSystemMessage },
      { type: 'input', key: 'apiToken', label: i18n.t('api-token'), props: { type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'model', label: i18n.t('model'), defaultValue: 'gemini-pro', props: { placeholder: 'e.g. gemini-pro' }, hasError: v => !v },
      { type: 'range', key: 'maxOutputTokens', label: 'Max Tokens', max: 4096, min: -1, step: 1, description: '-1 means unlimited', defaultValue: -1 },
      { type: 'range', key: 'temperature', label: 'Temperature', max: 1, min: 0, step: 0.01, defaultValue: 0.5 },
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
      watch(() => this.state.paramsJson, (json) => {
        const params = {
          maxOutputTokens: this.state.maxOutputTokens,
          temperature: this.state.temperature,
          ...this._parseJson(json),
        }

        this.state.maxOutputTokens = params.maxOutputTokens
        this.state.temperature = params.temperature
        this.state.paramsJson = JSON.stringify(params, null, 2)
      }),
      watch([
        () => this.state.maxOutputTokens,
        () => this.state.temperature,
      // eslint-disable-next-line camelcase
      ], ([maxOutputTokens, temperature]) => {
        const params = {
          ...this._parseJson(this.state.paramsJson, {}),
          maxOutputTokens,
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

    if (!instruction) {
      return
    }

    this.state.instruction = instruction

    const content = 'Instruction: ' + instruction + '\n\n' + selectedText
    const system = this.buildSystem(this.state.systemMessageV2, this.state.context)
    const params = this._parseJson(this.state.paramsJson, {})

    return this.request(this.state.model, this.state.apiToken, content, system, params, text => {
      onProgress({ text })
    }, token)
  }

  buildSystem (prompt: string, context: string) {
    if (!this.state.withContext) {
      return ''
    }

    return context.trim() ? prompt.replace('{CONTEXT}', context) : ''
  }
}
