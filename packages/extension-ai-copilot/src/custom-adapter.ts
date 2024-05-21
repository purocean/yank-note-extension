import { reactive } from 'vue'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { ctx } from '@yank-note/runtime-api'
import { CompletionAdapter, EditAdapter, FormItem, Panel, TextToImageAdapter } from '@/adapter'
import { CURSOR_PLACEHOLDER, CustomAdapter, i18n } from '@/core'
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

  defaultSystemMessage = `Fill content at the \`${CURSOR_PLACEHOLDER}\`. \n\nExample 1:\nInput: I like {CURSOR} dance with my hands\nOutput: dance\n\nExample 2:\nInput: I like dance with my {CURSOR}\nOutput: hands\n\nATTENTION: OUTPUT THE CONTENT DIRECTLY, NO SURROUNDING OR OTHER CONTENT.`

  defaultBuildRequestCode = `// https://developers.cloudflare.com/workers-ai/models/llama-3-8b-instruct/

const API_ACCOUNT_ID = 'YOUR_ACCOUNT_ID_HERE'
const API_TOKEN = 'YOUR_API_TOKEN_HERE'

// data is the input object
const { context, system, editorContext } = data

// 0: Automatic, Completion was triggered automatically while editing.
// 1: Explicit, Completion was triggered explicitly by a user gesture.
if (editorContext.triggerKind !== 1) {
  return
}

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

// data is the input object
const { res } = data

const obj = await res.json()
const text = obj.result.response
return [text]
`

 defaultOpenAIBuildRequestCode = `// data is the input object
const { context, system, editorContext, state } = data

// 0: Automatic, Completion was triggered automatically while editing.
// 1: Explicit, Completion was triggered explicitly by a user gesture.
if (editorContext.triggerKind !== 1) {
  return
}

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

  defaultOpenAIHandleResponseCode = `// data is the input object
const { res } = data

const obj = await res.json()
const text = obj?.choices[0]?.message?.content
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
        { type: 'textarea', key: 'systemMessage', label: i18n.t('system-message'), defaultValue: this.defaultSystemMessage },
        ...(adapter.preset === 'openai'
          ? [
            { type: 'input', key: 'endpoint', label: i18n.t('endpoint'), props: { placeholder: 'eg. ' + defaultApiPoint }, defaultValue: defaultApiPoint, hasError: v => !v },
            { type: 'input', key: 'apiToken', label: 'Api Token', props: { placeholder: 'sk-xxx', type: 'password' }, hasError: v => !v },
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

    let res: string[] = []
    const buildRequestFn = new AsyncFunction('data', this.state.buildRequestCode)
    const handleResponseFn = new AsyncFunction('data', this.state.handleResponseCode)

    try {
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

      res = await handleResponseFn.apply(this, [{ res: response }])
    } catch (error) {
      ctx.ui.useToast().show('warning', error.message)
      throw error
    }

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

  defaultSystemMessage = 'Generate/Modify content based on the context at the {CURSOR} position.\n--CONTEXT BEGIN--\n{CONTEXT}\n--CONTEXT END--\n\nATTENTION: OUTPUT THE CONTENT DIRECTLY, NO SURROUNDING OR OTHER CONTENT.'
  defaultBuildRequestCode = `// https://developers.cloudflare.com/workers-ai/models/llama-3-8b-instruct/

const API_ACCOUNT_ID = 'YOUR_ACCOUNT_ID_HERE'
const API_TOKEN = 'YOUR_API_TOKEN_HERE'

// data is the input object
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

// data is the input object
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
    withContext: true,
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
            { type: 'input', key: 'apiToken', label: 'Api Token', props: { placeholder: 'sk-xxx', type: 'password' }, hasError: v => !v },
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

  async fetchEditResults (selectedText: string, instruction: string, cancelToken: CancellationToken, onProgress: (res: { text: string }) => void): Promise<string | null | undefined> {
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
      class FatalError extends Error { }

      await fetchEventSource(url, {
        fetch: () => ctx.api.proxyFetch(url, { method, headers, body: body, proxy: this.state.proxy, signal: controller.signal }),
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
        onmessage: async (e) => {
          const data = e.data
          const { delta, done } = await handleResultFn.apply(this, [{ res: data, sse: true }])

          if (done) {
            throw new FatalError('DONE')
          }

          if (delta) {
            text += delta
            onProgress({ text })
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

  defaultBuildRequestCode = `// https://developers.cloudflare.com/workers-ai/models/dreamshaper-8-lcm/

const API_ACCOUNT_ID = 'YOUR_ACCOUNT_ID_HERE'
const API_TOKEN = 'YOUR_API_TOKEN_HERE'

// data is the input object
const { instruction } = data

const url = \`https://api.cloudflare.com/client/v4/accounts/\${API_ACCOUNT_ID}/ai/run/@cf/lykon/dreamshaper-8-lcm\`

const headers = {
  'Authorization': \`Bearer \${API_TOKEN}\`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ prompt: instruction })

return { url, headers, body, method: 'POST' }`

  defaultHandleResponseCode = `// https://developers.cloudflare.com/workers-ai/models/dreamshaper-8-lcm/

// data is the input object
const { res } = data

if (res.headers.get('Content-Type').startsWith('image')) {
  return { blob: await res.blob() }
} else {
  throw new Error(await res.text())
}`

  state = reactive({
    instruction: '',
    proxy: '',
    buildRequestCode: this.defaultBuildRequestCode,
    handleResponseCode: this.defaultHandleResponseCode,
  })

  panel: Panel = {
    type: 'form',
    items: [
      { type: 'instruction', key: 'instruction', label: i18n.t('instruction'), hasError: v => !v },
      { type: 'textarea', key: 'buildRequestCode', label: 'Build Request Code', defaultValue: this.defaultBuildRequestCode, hasError: v => !v, props: { style: { height: '10em' } } },
      { type: 'textarea', key: 'handleResponseCode', label: 'Handle Response Code', defaultValue: this.defaultHandleResponseCode, hasError: v => !v, props: { style: { height: '10em' } } },
      { type: 'input', key: 'proxy', label: i18n.t('proxy'), props: { placeholder: 'eg: http://127.0.0.1:8000' } },
    ],
  }

  constructor (adapter: CustomAdapter) {
    this.id = adapter.name
    this.displayname = adapter.name
    this.description = 'Custom Text to Image Adapter'
    this.logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CustomTextToImageAdapter.' + this.id)
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

    const buildRequestFn = new AsyncFunction('data', this.state.buildRequestCode)
    const handleResultFn = new AsyncFunction('data', this.state.handleResponseCode)

    const data = { instruction }

    const request = await buildRequestFn.apply(this, [data])
    if (!request) {
      return null
    }

    const { method, url, headers, body } = request
    this.logger.debug('Request:', url, headers, body)

    const controller = new AbortController()
    cancelToken.onCancellationRequested(() => controller.abort())
    const response = await ctx.api.proxyFetch(url, { method, headers, body, signal: controller.signal })
    this.logger.debug('Response:', response)
    const { blob } = await handleResultFn.apply(this, [{ res: response }])
    return blob
  }
}
