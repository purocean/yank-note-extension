import { reactive } from 'vue'
import * as gradio from '@gradio/client'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { ctx } from '@yank-note/runtime-api'
import { CompletionAdapter, EditAdapter, FormItem, Panel, TextToImageAdapter } from '@/adapter'
import { COMPLETION_DEFAULT_SYSTEM_MESSAGE, CustomAdapter, EDIT_DEFAULT_SYSTEM_MESSAGE, FatalError, i18n } from '@/core'
import type { CancellationToken, Position, editor, languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

export class CustomCompletionAdapter implements CompletionAdapter {
  type: 'completion' = 'completion'
  id: string
  displayname: string
  description: string
  supportProxy = false
  removable = true

  logger: ReturnType<typeof ctx.utils.getLogger>
  monaco = ctx.editor.getMonaco()

  defaultSystemMessage = COMPLETION_DEFAULT_SYSTEM_MESSAGE

  defaultBuildRequestCode = `// https://developers.cloudflare.com/workers-ai/models/llama-3-8b-instruct/

const API_ACCOUNT_ID = 'YOUR_ACCOUNT_ID_HERE'
const API_TOKEN = 'YOUR_API_TOKEN_HERE'

// data is the input object
const { context, system } = data

const messages = [
  {
    role: "system",
    content: system.replace('{CONTEXT}', context)
  },
  {
    role: "user",
    content: context
  },
]

const url = \`https://api.cloudflare.com/client/v4/accounts/\${API_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct\`

const headers = {
  'Authorization': \`Bearer \${API_TOKEN}\`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ messages })

return { url, headers, body, method: 'POST' }`

  defaultHandleResponseCode = `// https://developers.cloudflare.com/workers-ai/models/llama-3-8b-instruct/#using-streaming

const { res } = data

const obj = await res.json()
const text = obj.result.response
return [text]
`

 defaultOpenAIBuildRequestCode = `const { context, system, state } = data

const messages = [
  {
    role: "system",
    content: system.replace('{CONTEXT}', context)
  },
  {
    role: "user",
    content: context
  },
]

const url = state.endpoint

const headers = {
  'Authorization': \`Bearer \${state.apiToken}\`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ messages, model: state.model })

return { url, headers, body, method: 'POST' }`

  defaultOpenAIHandleResponseCode = `const { res } = data

const obj = await res.json()
const text = obj.choices[0].message.content
return [text]`

  panel: Panel

  state = reactive({
    endpoint: '',
    apiToken: '',
    model: 'gpt-3.5-turbo',
    context: '',
    proxy: '',
    systemMessage: this.defaultSystemMessage,
    buildRequestCode: this.defaultBuildRequestCode,
    handleResponseCode: this.defaultHandleResponseCode,
    autoTrigger: false,
  })

  constructor (adapter: CustomAdapter) {
    this.id = adapter.name
    this.displayname = adapter.name
    this.description = 'Custom Completion Adapter'
    this.logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CustomCompletionAdapter.' + this.id)

    const defaultApiPoint = 'https://api.openai.com/v1/chat/completions'

    this.panel = {
      type: 'form',
      items: [
        { type: 'context', key: 'context', label: i18n.t('context') },
        { type: 'checkbox', key: 'autoTrigger', label: i18n.t('auto-trigger'), description: i18n.t('auto-trigger-completion-desc'), defaultValue: false },
        { type: 'textarea', key: 'systemMessage', label: i18n.t('system-message'), defaultValue: this.defaultSystemMessage },
        ...(adapter.preset === 'openai'
          ? [
            { type: 'input', key: 'endpoint', label: i18n.t('endpoint'), props: { placeholder: 'eg. ' + defaultApiPoint }, defaultValue: defaultApiPoint, hasError: v => !v },
            { type: 'input', key: 'apiToken', label: i18n.t('api-token'), props: { placeholder: 'sk-xxx', type: 'password' } },
            { type: 'input', key: 'model', label: i18n.t('model'), defaultValue: 'gpt-3.5-turbo', props: { placeholder: 'e.g. gpt-4 or gpt-3.5-turbo' }, hasError: v => !v },
          ] as FormItem[]
          : []),
        { type: 'textarea', key: 'buildRequestCode', label: 'Build Request Code', defaultValue: adapter.preset === 'openai' ? this.defaultOpenAIBuildRequestCode : this.defaultBuildRequestCode, hasError: v => !v },
        { type: 'textarea', key: 'handleResponseCode', label: 'Handle Response Code', defaultValue: adapter.preset === 'openai' ? this.defaultOpenAIHandleResponseCode : this.defaultHandleResponseCode, hasError: v => !v },
        { type: 'input', key: 'proxy', label: i18n.t('proxy'), props: { placeholder: 'eg: http://127.0.0.1:8000' } },
      ],
    }

    if (adapter.preset === 'openai') {
      this.state.buildRequestCode = this.defaultOpenAIBuildRequestCode
      this.state.handleResponseCode = this.defaultOpenAIHandleResponseCode
    }
  }

  activate () {
    return {
      dispose: () => 0,
      state: this.state
    }
  }

  async fetchCompletionResults (_model: editor.ITextModel, position: Position, editorContext: languages.InlineCompletionContext, cancelToken: CancellationToken) {
    if (!this.state.context) {
      return { items: [] }
    }

    // Only trigger when the triggerKind is Explicit if autoTrigger is disabled
    if (!this.state.autoTrigger && editorContext.triggerKind !== this.monaco.languages.InlineCompletionTriggerKind.Explicit) {
      return { items: [] }
    }

    let res: string[] = []
    const buildRequestFn = new AsyncFunction('data', this.state.buildRequestCode)
    const handleResponseFn = new AsyncFunction('data', this.state.handleResponseCode)

    const data = {
      context: this.state.context,
      system: this.state.systemMessage,
      editorContext,
      state: this.state,
    }

    const request = await buildRequestFn.apply(this, [data])
    this.logger.debug('Request:', request)

    if (!request) {
      return { items: [] }
    }

    const { url, headers, body, method } = request

    const controller = new AbortController()
    cancelToken.onCancellationRequested(() => controller.abort())
    const response = await ctx.api.proxyFetch(url, { method, headers, body, signal: controller.signal, proxy: this.state.proxy })
    this.logger.debug('Response:', response)

    if (!response.ok) {
      throw new Error(await response.text())
    }

    res = await handleResponseFn.apply(this, [{ res: response }])

    const range = new this.monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    )

    const items = res.map(text => {
      return { text: text, insertText: { snippet: text }, range }
    })

    return { items }
  }
}

export class CustomEditAdapter implements EditAdapter {
  type: 'edit' = 'edit'
  id: string
  displayname: string
  description: string
  supportProxy = false
  removable = true

  logger: ReturnType<typeof ctx.utils.getLogger>
  monaco = ctx.editor.getMonaco()

  defaultSystemMessage = EDIT_DEFAULT_SYSTEM_MESSAGE

  defaultBuildRequestCode = `// https://developers.cloudflare.com/workers-ai/models/llama-3-8b-instruct/

const API_ACCOUNT_ID = 'YOUR_ACCOUNT_ID_HERE'
const API_TOKEN = 'YOUR_API_TOKEN_HERE'

const { selectedText, instruction, context, system } = data

// if context is not provided, system message will be empty
const systemMessage = context ? system.replace('{CONTEXT}', context) : ''
const userMessage = \`
Instruction: \${instruction}

\${selectedText}
\`.trim()

const messages = [{
  role: "user",
  content: userMessage
}]

messages.unshift({
  role: "system",
  content: systemMessage || 'ATTENTION: OUTPUT THE CONTENT DIRECTLY, NO SURROUNDING OR OTHER CONTENT.'
})

const url = \`https://api.cloudflare.com/client/v4/accounts/\${API_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct\`

const headers = {
  'Authorization': \`Bearer \${API_TOKEN}\`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ messages, stream: true })
const sse = true // use server-sent events to stream the response

return { url, headers, body, method: 'POST', sse }`

  defaultHandleResponseCode = `// https://developers.cloudflare.com/workers-ai/models/llama-3-8b-instruct/#using-streaming

const { res, sse } = data

if (sse) { // SSE message, res is a string
  if (res === '[DONE]') {
    return { done: true }
  }

  const payload = JSON.parse(res)
  const delta = payload.response

  return { delta }
} else { // normal response, res is a Response object
  const obj = await res.json()
  const text = obj.result.response
  return { text }
}`

defaultOpenAIBuildRequestCode = `// data is the input object
const { selectedText, instruction, context, system, state } = data

// if context is not provided, system message will be empty
const systemMessage = context ? system.replace('{CONTEXT}', context) : ''
const userMessage = \`
Instruction: \${instruction}

\${selectedText}
\`.trim()

const messages = [{
  role: "user",
  content: userMessage
}]

messages.unshift({
  role: "system",
  content: systemMessage || 'ATTENTION: OUTPUT THE CONTENT DIRECTLY, NO SURROUNDING OR OTHER CONTENT.'
})

const url = state.endpoint

const headers = {
  'Authorization': \`Bearer \${state.apiToken}\`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ messages, model: state.model, stream: true })
const sse = true // use server-sent events to stream the response

return { url, headers, body, method: 'POST', sse }`

defaultOpenAIHandleResponseCode = `// data is the input object
const { res } = data

if (res === '[DONE]') {
  return { done: true }
}

const payload = JSON.parse(res)
const delta = payload?.choices[0]?.delta?.content

return { delta }`

  state = reactive({
    endpoint: '',
    apiToken: '',
    model: 'gpt-3.5-turbo',
    context: '',
    withContext: false,
    selection: '',
    instruction: '',
    proxy: '',
    systemMessage: this.defaultSystemMessage,
    buildRequestCode: this.defaultBuildRequestCode,
    handleResponseCode: this.defaultHandleResponseCode,
  })

  panel: Panel

  constructor (adapter: CustomAdapter) {
    this.id = adapter.name
    this.displayname = adapter.name
    this.description = 'Custom Edit Adapter'
    this.logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CustomEditAdapter.' + this.id)

    const defaultApiPoint = 'https://api.openai.com/v1/chat/completions'

    this.panel = {
      type: 'form',
      items: [
        { type: 'selection', key: 'selection', label: i18n.t('selected-text'), props: { readonly: true } },
        { type: 'context', key: 'context', label: i18n.t('context') },
        { type: 'instruction', key: 'instruction', label: i18n.t('instruction'), hasError: v => !v },
        { type: 'textarea', key: 'systemMessage', label: i18n.t('system-message'), defaultValue: this.defaultSystemMessage },
        ...(adapter.preset === 'openai'
          ? [
            { type: 'input', key: 'endpoint', label: i18n.t('endpoint'), props: { placeholder: 'eg. ' + defaultApiPoint }, defaultValue: defaultApiPoint, hasError: v => !v },
            { type: 'input', key: 'apiToken', label: i18n.t('api-token'), props: { placeholder: 'sk-xxx', type: 'password' } },
            { type: 'input', key: 'model', label: i18n.t('model'), defaultValue: 'gpt-3.5-turbo', props: { placeholder: 'e.g. gpt-4 or gpt-3.5-turbo' }, hasError: v => !v },
          ] as FormItem[]
          : []),
        { type: 'textarea', key: 'buildRequestCode', label: 'Build Request Code', defaultValue: adapter.preset === 'openai' ? this.defaultOpenAIBuildRequestCode : this.defaultBuildRequestCode, hasError: v => !v },
        { type: 'textarea', key: 'handleResponseCode', label: 'Handle Response Code', defaultValue: adapter.preset === 'openai' ? this.defaultOpenAIHandleResponseCode : this.defaultHandleResponseCode, hasError: v => !v },
        { type: 'input', key: 'proxy', label: i18n.t('proxy'), props: { placeholder: 'eg: http://127.0.0.1:8000' } },
      ],
    }

    if (adapter.preset === 'openai') {
      this.state.buildRequestCode = this.defaultOpenAIBuildRequestCode
      this.state.handleResponseCode = this.defaultOpenAIHandleResponseCode
    }
  }

  activate () {
    return {
      dispose: () => 0,
      state: this.state
    }
  }

  async fetchEditResults (selectedText: string, instruction: string, cancelToken: CancellationToken, onProgress: (res: { text: string, delta: string }) => void): Promise<string | null | undefined> {
    if (!instruction) {
      return
    }

    this.state.instruction = instruction

    if (!this.state.buildRequestCode || !this.state.handleResponseCode) {
      ctx.ui.useToast().show('warning', 'Please fill in the Build Request Code and Handle Response Code')
      return
    }

    const buildRequestFn = new AsyncFunction('data', this.state.buildRequestCode)
    const handleResultFn = new AsyncFunction('data', this.state.handleResponseCode)

    const data = {
      selectedText,
      instruction,
      context: this.state.context,
      system: this.state.withContext ? this.state.systemMessage : '',
      state: this.state,
    }

    const request = await buildRequestFn.apply(this, [data])
    if (!request) {
      return null
    }

    const { method, url, headers, body, sse } = request
    this.logger.debug('Request:', url, headers, body, sse)

    const controller = new AbortController()
    cancelToken.onCancellationRequested(() => controller.abort())

    if (!sse) {
      const response = await ctx.api.proxyFetch(url, { method, headers, body, signal: controller.signal })
      this.logger.debug('Response:', response)
      const { text } = await handleResultFn.apply(this, [{ res: response, sse: false }])
      return text
    } else {
      let text = ''

      await fetchEventSource(url, {
        fetch: () => ctx.api.proxyFetch(url, { method, headers, body: body, proxy: this.state.proxy, signal: controller.signal }),
        async onopen (response) {
          if (response.ok && response.headers.get('content-type')?.includes(EventStreamContentType)) {
            return
          }

          if (response.headers.get('content-type')?.includes('application/json')) {
            const text = await response.text()
            throw new Error(text)
          } else {
            throw new Error(response.statusText)
          }
        },
        onmessage: async (e) => {
          const data = e.data
          const { delta, done } = await handleResultFn.apply(this, [{ res: data, sse: true }])

          if (done) {
            throw new FatalError('DONE')
          }

          if (delta) {
            text += delta
            onProgress({ text, delta })
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
            if (!String(err).includes('aborted')) {
              ctx.ui.useToast().show('warning', err.message, 5000)
            }
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

      return text || null
    }
  }
}

export class CustomTextToImageAdapter implements TextToImageAdapter {
  type: 'text2image' = 'text2image'
  id: string
  displayname: string
  description: string
  supportProxy = false
  removable = true

  logger: ReturnType<typeof ctx.utils.getLogger>
  monaco = ctx.editor.getMonaco()

  defaultBuildRequestCode = `const { width, height, endpoint, apiToken, instruction, model } = data

const url = \`\${endpoint}/ai/run/\${model}\`

const headers = {
  'Authorization': \`Bearer \${apiToken}\`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ prompt: instruction, width, height })

return { url, headers, body, method: 'POST' }`

  defaultHandleResponseCode = `const { res } = data

if (res.headers.get('Content-Type').startsWith('image')) {
  return { blob: await res.blob() }
} else {
  throw new Error(await res.text())
}`

  defaultGradioBuildRequestCode = `const { width, height, apiToken, instruction, endpoint } = data

const client = await env.gradio.Client.connect(endpoint, { hf_token: apiToken });

const result = await client.predict("/infer", {
    prompt: instruction,
    seed: 0,
    width,
    height,
    randomize_seed: true,
    num_inference_steps: 4,
});

const url = result?.data?.[0]?.url

if (!url) {
  throw new Error(JSON.stringify(result))
}

return { url, method: 'GET' }`

  defaultGradioHandleResponseCode = `const { res } = data

if (res.headers.get('Content-Type').startsWith('image')) {
  return { blob: await res.blob() }
} else {
  throw new Error(await res.text())
}`

  state = reactive({
    instruction: '',
    proxy: '',
    apiToken: '',
    endpoint: 'https://api.cloudflare.com/client/v4/accounts/API_ACCOUNT_ID',
    model: '@cf/lykon/dreamshaper-8-lcm',
    width: 512,
    height: 512,
    buildRequestCode: this.defaultBuildRequestCode,
    handleResponseCode: this.defaultHandleResponseCode,
  })

  panel: Panel

  constructor (adapter: CustomAdapter) {
    this.id = adapter.name
    this.displayname = adapter.name
    this.description = 'Custom Text to Image Adapter'
    this.logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CustomTextToImageAdapter.' + this.id)

    this.panel = {
      type: 'form',
      items: [
        { type: 'instruction', key: 'instruction', label: i18n.t('instruction'), hasError: v => !v },
        { type: 'input', key: 'endpoint', label: i18n.t('endpoint'), props: { placeholder: adapter.preset === 'gradio' ? 'eg. black-forest-labs/FLUX.1-schnell' : 'eg. https://api.cloudflare.com/client/v4/accounts/API_ACCOUNT_ID' }, hasError: v => !v },
        { type: 'input', key: 'apiToken', label: i18n.t('api-token'), props: { placeholder: '', type: 'password' } },
        ...(adapter.preset === 'gradio'
          ? []
          : [
            { type: 'input', key: 'model', label: i18n.t('model'), hasError: v => !v },
          ] as FormItem[]),
        { type: 'range', key: 'width', label: i18n.t('width'), defaultValue: 512, min: 1, max: 1920, step: 1 },
        { type: 'range', key: 'height', label: i18n.t('height'), defaultValue: 512, min: 1, max: 1920, step: 1 },
        { type: 'textarea', key: 'buildRequestCode', label: 'Build Request Code', defaultValue: adapter.preset === 'gradio' ? this.defaultGradioBuildRequestCode : this.defaultBuildRequestCode, hasError: v => !v, props: { style: { height: '10em' } } },
        { type: 'textarea', key: 'handleResponseCode', label: 'Handle Response Code', defaultValue: adapter.preset === 'gradio' ? this.defaultGradioHandleResponseCode : this.defaultHandleResponseCode, hasError: v => !v, props: { style: { height: '10em' } } },
        { type: 'input', key: 'proxy', label: i18n.t('proxy'), props: { placeholder: 'eg: http://127.0.0.1:8000' } },
      ],
    }

    if (adapter.preset === 'gradio') {
      this.state.buildRequestCode = this.defaultGradioBuildRequestCode
      this.state.handleResponseCode = this.defaultGradioHandleResponseCode
    }
  }

  activate () {
    return {
      dispose: () => 0,
      state: this.state
    }
  }

  async fetchTextToImageResults (instruction: string, cancelToken: CancellationToken): Promise<Blob | null | undefined> {
    if (!instruction) {
      return
    }

    this.state.instruction = instruction

    if (!this.state.buildRequestCode || !this.state.handleResponseCode) {
      ctx.ui.useToast().show('warning', 'Please fill in the Build Request Code and Handle Response Code')
      return
    }

    const controller = new AbortController()
    cancelToken.onCancellationRequested(() => controller.abort())

    const buildRequestFn = new AsyncFunction('data', 'env', this.state.buildRequestCode)
    const handleResultFn = new AsyncFunction('data', this.state.handleResponseCode)

    const data = { ...this.state }
    const env = { gradio, signal: controller.signal }

    const request = await buildRequestFn.apply(this, [data, env])
    if (!request) {
      return null
    }

    let response: any
    if (typeof request === 'function') {
      response = await request()
    } else {
      const { method, url, headers, body } = request
      this.logger.debug('Request:', url, headers, body)
      response = await ctx.api.proxyFetch(url, { method, headers, body, signal: controller.signal, proxy: this.state.proxy })
    }

    this.logger.debug('Response:', response)
    const { blob } = await handleResultFn.apply(this, [{ res: response }])
    return blob
  }
}
