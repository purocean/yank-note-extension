import { CompletionAdapter, EditAdapter, Panel } from '@/adapter'
import { i18n, CURSOR_PLACEHOLDER } from '@/core'
import { ctx } from '@yank-note/runtime-api'
import { Position, editor, languages, CancellationToken } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { reactive } from 'vue'

interface Params {
  secret: string,
  key: string,
  appid: string,
  versionStr: string,
  temperature?: number; // [0,1] 0.5
  maxTokens?: number; // [1, 4096] 2048
  topK?: number; // [1, 6] 4
  system?: string;
  content: string;
}

class BaseAdapter {
  description = 'Powered by <a target="_blank" href="https://xinghuo.xfyun.cn/">星火大模型</a>'
  _inRequest = false

  private _generateUrl (params: Params) {
    const host = 'spark-api.xf-yun.com'
    const date = new Date().toUTCString() // 'Sun, 11 Jun 2023 01:31:08 GMT'; //

    const APISecret = params.secret
    const APIKey = params.key
    const tmp = `host: ${host}\ndate: ${date}\nGET /${params.versionStr}/chat HTTP/1.1`
    const sign = ctx.lib.cryptojs.HmacSHA256(tmp, APISecret).toString(ctx.lib.cryptojs.enc.Base64)
    const authorizationOrigin = `api_key="${APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${sign}"`
    const authorization = ctx.utils.strToBase64(authorizationOrigin)

    const data = { host, date, authorization }

    const arr: string[] = []
    for (const k in data) {
      arr.push(`${k}=${data[k]}`)
    }
    return `wss://${host}/${params.versionStr}/chat?${arr.join('&')}`
  }

  async request (params: Params, token: CancellationToken, onProgress?: (res: { text: string }) => void) {
    return new Promise<string>((resolve, reject) => {
      const url = this._generateUrl(params)

      if (this._inRequest) {
        return reject(new Error('IS_IN_REQUEST'))
      }

      this._inRequest = true

      const ws = new window.WebSocket(url)

      ws.onerror = (e) => {
        this._inRequest = false
        console.error(e)
        reject(new Error('WS_ON_ERROR'))
      }

      ws.onclose = () => {
        this._inRequest = false
      }

      ws.onopen = () => {
        const header = {
          app_id: params.appid,
        }

        const chat = {
          domain: 'general' + params.versionStr,
          temperature: params.temperature,
          max_tokens: params.maxTokens,
          top_k: params.topK,
        }

        const text: { role: 'system' | 'assistant' | 'user', content: string }[] = []

        if (params.system) {
          text.push({ role: 'system', content: params.system })
        }

        text.push({ role: 'user', content: params.content })

        ws.send(JSON.stringify({
          header,
          parameter: { chat },
          payload: { message: { text } }
        }))
      }

      const answers: string[] = []

      token.onCancellationRequested(() => {
        if (this._inRequest) {
          ws.close()
          this._inRequest = false
        }
      })

      ws.onmessage = (e: any) => {
        const { header, payload } = JSON.parse(e.data)
        if (header.code !== 0) {
          reject(new Error('MESSAGE_ERROR:' + header.message))
          this._inRequest = false
          return
        }

        const seqContent = payload.choices.text.map((item: any) => item.content).join('')
        const seq = payload.choices.seq

        answers[seq] = seqContent

        try {
          onProgress && onProgress({ text: answers.join('') })
        } catch (error) {
          console.error(error)
        }

        const end = header.status === 2

        if (end) {
          this._inRequest = false
          const answerContent = answers.join('')
          resolve(answerContent)
        }
      }
    })
  }
}

export class SparkAICompletionAdapter extends BaseAdapter implements CompletionAdapter {
  type: 'completion' = 'completion'
  id = 'spark-ai-completion'
  displayname = 'Spark'
  monaco = ctx.editor.getMonaco()
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.SparkAICompletionAdapter')
  defaultSystemMessage = `Fill content at the \`${CURSOR_PLACEHOLDER}\`. \n\nExample 1:\nInput: I like {CURSOR} dance with my hands\nOutput: dance\n\nExample 2:\nInput: I like dance with my {CURSOR}\nOutput: hands\n\nAttention: Only output the filled content, do not output the surrounding content.`

  state = reactive({
    context: '',
    systemMessage: this.defaultSystemMessage,
    version: 'v3.5',
    appid: '',
    apiSecret: '',
    apiKey: '',
    maxTokens: 2048,
    topK: 4,
    temperature: 0.5,
  })

  panel: Panel = {
    type: 'form',
    items: [
      { type: 'context', key: 'context', label: i18n.t('context'), hasError: v => !v },
      { type: 'input', key: 'appid', label: 'APPID', hasError: v => !v },
      { type: 'input', key: 'apiSecret', label: 'API Secret', props: { type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'apiKey', label: 'API Key', props: { type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'version', label: 'Version', defaultValue: 'v3.5', props: { placeholder: 'e.g. v3.5' }, hasError: v => !v },
      { type: 'textarea', key: 'systemMessage', label: 'System Message', defaultValue: this.defaultSystemMessage },
      { type: 'range', key: 'maxTokens', label: 'Max Tokens', max: 4096, min: 1, step: 1, defaultValue: 2048 },
      { type: 'range', key: 'temperature', label: 'Temperature', max: 1, min: 0, step: 0.01, defaultValue: 0.5 },
      { type: 'range', key: 'topK', label: 'Top K', max: 6, min: 1, step: 1, defaultValue: 4 },
    ],
  }

  activate (): { dispose: () => void, state: Record<string, any> } {
    return {
      state: this.state,
      dispose: () => 0
    }
  }

  async fetchCompletionResults (_model: editor.ITextModel, position: Position, context: languages.InlineCompletionContext, token: CancellationToken): Promise<languages.InlineCompletions> {
    if (context.triggerKind !== this.monaco.languages.InlineCompletionTriggerKind.Explicit) {
      return { items: [] }
    }

    const range = new this.monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    )

    if (!this.state.context || !this.state.version || !this.state.appid || !this.state.apiSecret || !this.state.apiKey) {
      return { items: [] }
    }

    const content = this.state.context
    const system = this.state.systemMessage

    const text = await this.request({
      content,
      system,
      secret: this.state.apiSecret,
      key: this.state.apiKey,
      appid: this.state.appid,
      versionStr: this.state.version,
      temperature: this.state.temperature,
      maxTokens: this.state.maxTokens,
      topK: this.state.topK
    }, token)

    return {
      items: [{
        text,
        insertText: { snippet: text },
        range
      }] as any[]
    }
  }
}

export class SparkAIEditAdapter extends BaseAdapter implements EditAdapter {
  type: 'edit' = 'edit'
  id = 'spark-ai-edit'
  displayname = 'Spark'
  monaco = ctx.editor.getMonaco()
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.SparkAIEditAdapter')
  defaultInstruction = 'Translate to English'
  defaultSystemMessage = 'Generate/Modify content based on the context at the {CURSOR} position.\n--CONTEXT BEGIN--\n{CONTEXT}\n--CONTEXT END--\n\nAttention: Output the content directly, no surrounding content.'

  state = reactive({
    selection: '',
    context: '',
    instruction: this.defaultInstruction,
    systemMessage: this.defaultSystemMessage,
    version: 'v3.5',
    appid: '',
    apiSecret: '',
    apiKey: '',
    maxTokens: 2048,
    topK: 4,
    temperature: 0.5,
  })

  panel: Panel = {
    type: 'form',
    items: [
      { type: 'selection', key: 'selection', label: i18n.t('selected-text'), props: { readonly: true } },
      { type: 'context', key: 'context', label: i18n.t('context') },
      { type: 'instruction', key: 'instruction', label: i18n.t('instruction'), hasError: v => !v },
      { type: 'textarea', key: 'systemMessage', label: 'System Message', defaultValue: this.defaultSystemMessage },
      { type: 'input', key: 'appid', label: 'APPID', hasError: v => !v },
      { type: 'input', key: 'apiSecret', label: 'API Secret', props: { type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'apiKey', label: 'API Key', props: { type: 'password' }, hasError: v => !v },
      { type: 'input', key: 'version', label: 'Version', defaultValue: 'v3.5', props: { placeholder: 'e.g. v3.5' }, hasError: v => !v },
      { type: 'range', key: 'maxTokens', label: 'Max Tokens', max: 4096, min: 1, step: 1, defaultValue: 2048 },
      { type: 'range', key: 'temperature', label: 'Temperature', max: 1, min: 0, step: 0.01, defaultValue: 0.5 },
      { type: 'range', key: 'topK', label: 'Top K', max: 6, min: 1, step: 1, defaultValue: 4 },
    ],
  }

  activate (): { dispose: () => void, state: Record<string, any> } {
    return {
      state: this.state,
      dispose: () => 0
    }
  }

  async fetchEditResults (selectedText: string, instruction: string, token: CancellationToken, onProgress: (res: { text: string }) => void): Promise<string | null | undefined> {
    if (!this.state.appid || !this.state.apiSecret || !this.state.apiKey) {
      return
    }

    if (!instruction) {
      return
    }

    this.state.instruction = instruction

    const content = 'Instruction: ' + instruction + '\n\n' + selectedText
    const system = this.buildSystem(this.state.systemMessage, this.state.context)

    const result = await this.request({
      content,
      system,
      secret: this.state.apiSecret,
      key: this.state.apiKey,
      appid: this.state.appid,
      versionStr: this.state.version,
      temperature: this.state.temperature,
      maxTokens: this.state.maxTokens,
      topK: this.state.topK
    }, token, onProgress)

    return result
  }

  buildSystem (prompt: string, context: string) {
    return context.trim() ? prompt.replace('{CONTEXT}', context) : ''
  }
}
