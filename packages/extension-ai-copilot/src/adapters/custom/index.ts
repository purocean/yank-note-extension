import { computed, defineComponent, h, nextTick, reactive, ref, watch } from 'vue'
import * as gradio from '@gradio/client'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { ctx, runtimeVersionSatisfies } from '@yank-note/runtime-api'
import { Adapter, AdapterType, CompletionAdapter, EditAdapter, getAllAdapters, Panel, TextToImageAdapter } from '@/lib/adapter'
import { addCustomAdapters, COMPLETION_DEFAULT_SYSTEM_MESSAGE, CustomAdapter, EDIT_DEFAULT_SYSTEM_MESSAGE, FatalError, i18n } from '@/lib/core'
import { CompletionDefaultPreset } from './completion/default/index'
import type { CancellationToken, Position, editor, languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { CompletionOpenAIPreset } from './completion/openai'
import { CompletionDifyWorkflowPreset } from './completion/dify-workflow'
import { EditDefaultPreset } from './edit/default'
import { EditOpenAIPreset } from './edit/openai'
import { EditDifyWorkflowPreset } from './edit/dify-workflow'
import { Text2ImageDefaultPreset } from './text2image/default'
import { Text2ImageGradioPreset } from './text2image/gradio'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

type CustomAdapterPresetName = CustomAdapter['preset']

export interface CustomAdapterPreset {
  name: CustomAdapterPresetName,
  displayName (): string,
  requestCode: string,
  responseCode: string,
  params (): Record<string, { displayName: string, params: Record<string, any> }>
  processAdapter? (adapter: Adapter): void
}

const customAdapterPresets: Record<AdapterType, Partial<Record<CustomAdapterPresetName, CustomAdapterPreset>>> = {
  completion: {
    openai: new CompletionOpenAIPreset(),
    'dify-workflow': new CompletionDifyWorkflowPreset(),
    custom: new CompletionDefaultPreset(),
  },
  edit: {
    openai: new EditOpenAIPreset(),
    'dify-workflow': new EditDifyWorkflowPreset(),
    custom: new EditDefaultPreset(),
  },
  text2image: {
    gradio: new Text2ImageGradioPreset(),
    custom: new Text2ImageDefaultPreset(),
  }
}

export class CustomCompletionAdapter implements CompletionAdapter {
  type: 'completion' = 'completion'
  id: string
  displayname: string
  description: string
  supportProxy = false
  removable = true

  adapter: CustomAdapter

  logger: ReturnType<typeof ctx.utils.getLogger>
  monaco = ctx.editor.getMonaco()

  defaultSystemMessage = COMPLETION_DEFAULT_SYSTEM_MESSAGE

  panel: Panel

  state = reactive({
    __buildRequestCodeChanged: false,
    __handleResponseCodeChanged: false,
    endpoint: '',
    apiToken: '',
    model: '',
    context: '',
    proxy: '',
    systemMessage: this.defaultSystemMessage,
    buildRequestCode: '',
    handleResponseCode: '',
    autoTrigger: false,
  })

  constructor (adapter: CustomAdapter) {
    this.adapter = adapter
    this.id = adapter.name
    this.displayname = adapter.name
    this.description = 'Custom Completion Adapter'
    this.logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CustomCompletionAdapter.' + this.id)

    const { buildRequestCode, handleResponseCode } = this.getDefaultCode()

    this.panel = {
      type: 'form',
      items: [
        { type: 'context', key: 'context', label: i18n.t('context') },
        { type: 'checkbox', key: 'autoTrigger', label: i18n.t('auto-trigger'), description: i18n.t('auto-trigger-completion-desc'), defaultValue: false },
        { type: 'textarea', key: 'systemMessage', label: i18n.t('system-message'), defaultValue: this.defaultSystemMessage },
        { type: 'input', key: 'endpoint', label: i18n.t('endpoint'), props: { placeholder: '' }, defaultValue: '', hasError: v => !v },
        { type: 'input', key: 'apiToken', label: i18n.t('api-token'), props: { placeholder: '', type: 'password' } },
        { type: 'input', key: 'model', label: i18n.t('model'), defaultValue: '', props: { placeholder: '' }, hasError: v => !v },
        { type: 'textarea', key: 'buildRequestCode', label: 'Build Request Code', advanced: true, defaultValue: buildRequestCode, marked: v => v !== buildRequestCode, hasError: v => !v, props: { style: { height: '10em' } } },
        { type: 'textarea', key: 'handleResponseCode', label: 'Handle Response Code', advanced: true, defaultValue: handleResponseCode, marked: v => v !== handleResponseCode, hasError: v => !v, props: { style: { height: '10em' } } },
        { type: 'input', key: 'proxy', label: i18n.t('proxy'), props: { placeholder: 'eg: http://127.0.0.1:8000' } },
      ],
    }

    this.state.buildRequestCode = buildRequestCode
    this.state.handleResponseCode = handleResponseCode

    const adapterPreset = customAdapterPresets[this.type][this.adapter.preset]

    if (adapterPreset?.processAdapter) {
      adapterPreset.processAdapter(this)
    }
  }

  activate () {
    const { buildRequestCode, handleResponseCode } = this.getDefaultCode()

    let stopWatch: () => void

    nextTick(() => {
      if (!this.state.__buildRequestCodeChanged) {
        this.state.buildRequestCode = buildRequestCode
      }

      if (!this.state.__handleResponseCodeChanged) {
        this.state.handleResponseCode = handleResponseCode
      }

      stopWatch = watch(() => [this.state.buildRequestCode, this.state.handleResponseCode], () => {
        this.state.__buildRequestCodeChanged = this.state.buildRequestCode.trim() !== buildRequestCode
        this.state.__handleResponseCodeChanged = this.state.handleResponseCode.trim() !== handleResponseCode
      })
    })

    return {
      dispose: () => {
        stopWatch()
      },
      state: this.state
    }
  }

  getDefaultCode () {
    const adapterPreset = customAdapterPresets[this.type][this.adapter.preset]

    const buildRequestCode = (adapterPreset?.requestCode || '').trim()
    const handleResponseCode = (adapterPreset?.responseCode || '').trim()

    return { buildRequestCode, handleResponseCode }
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

  adapter: CustomAdapter

  logger: ReturnType<typeof ctx.utils.getLogger>
  monaco = ctx.editor.getMonaco()

  defaultSystemMessage = EDIT_DEFAULT_SYSTEM_MESSAGE

  state = reactive({
    __buildRequestCodeChanged: false,
    __handleResponseCodeChanged: false,
    endpoint: '',
    apiToken: '',
    model: '',
    context: '',
    withContext: false,
    selection: '',
    instruction: '',
    proxy: '',
    systemMessage: this.defaultSystemMessage,
    buildRequestCode: '',
    handleResponseCode: '',
  })

  panel: Panel

  constructor (adapter: CustomAdapter) {
    this.adapter = adapter
    this.id = adapter.name
    this.displayname = adapter.name
    this.description = 'Custom Edit Adapter'
    this.logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CustomEditAdapter.' + this.id)

    const { buildRequestCode, handleResponseCode } = this.getDefaultCode()

    this.panel = {
      type: 'form',
      items: [
        { type: 'selection', key: 'selection', advanced: true, label: i18n.t('selected-text'), props: { readonly: true } },
        { type: 'context', key: 'context', label: i18n.t('context') },
        { type: 'instruction', key: 'instruction', label: i18n.t('instruction'), hasError: v => !v },
        { type: 'textarea', key: 'systemMessage', label: i18n.t('system-message'), defaultValue: this.defaultSystemMessage },
        { type: 'input', key: 'endpoint', label: i18n.t('endpoint'), props: { placeholder: '' }, defaultValue: '', hasError: v => !v },
        { type: 'input', key: 'apiToken', label: i18n.t('api-token'), props: { placeholder: '', type: 'password' } },
        { type: 'input', key: 'model', label: i18n.t('model'), defaultValue: '', props: { placeholder: '' }, hasError: v => !v },
        { type: 'textarea', key: 'buildRequestCode', advanced: true, label: 'Build Request Code', defaultValue: buildRequestCode, marked: v => v !== buildRequestCode, hasError: v => !v, props: { style: { height: '10em' } } },
        { type: 'textarea', key: 'handleResponseCode', advanced: true, label: 'Handle Response Code', defaultValue: handleResponseCode, marked: v => v !== handleResponseCode, hasError: v => !v, props: { style: { height: '10em' } } },
        { type: 'input', key: 'proxy', label: i18n.t('proxy'), props: { placeholder: 'eg: http://127.0.0.1:8000' } },
      ],
    }

    this.state.buildRequestCode = buildRequestCode
    this.state.handleResponseCode = handleResponseCode

    const adapterPreset = customAdapterPresets[this.type][this.adapter.preset]

    if (adapterPreset?.processAdapter) {
      adapterPreset.processAdapter(this)
    }
  }

  activate () {
    const { buildRequestCode, handleResponseCode } = this.getDefaultCode()

    let stopWatch: () => void

    nextTick(() => {
      if (!this.state.__buildRequestCodeChanged) {
        this.state.buildRequestCode = buildRequestCode
      }

      if (!this.state.__handleResponseCodeChanged) {
        this.state.handleResponseCode = handleResponseCode
      }

      stopWatch = watch(() => [this.state.buildRequestCode, this.state.handleResponseCode], () => {
        this.state.__buildRequestCodeChanged = this.state.buildRequestCode.trim() !== buildRequestCode
        this.state.__handleResponseCodeChanged = this.state.handleResponseCode.trim() !== handleResponseCode
      })
    })

    return {
      dispose: () => {
        stopWatch()
      },
      state: this.state
    }
  }

  getDefaultCode () {
    const adapterPreset = customAdapterPresets[this.type][this.adapter.preset]

    const buildRequestCode = (adapterPreset?.requestCode || '').trim()
    const handleResponseCode = (adapterPreset?.responseCode || '').trim()

    return { buildRequestCode, handleResponseCode }
  }

  async fetchEditResults (selectedText: string, instruction: string, cancelToken: CancellationToken, onProgress: (res: { text: string, delta: string }) => void, updateStatus: (status: string) => void): Promise<string | null | undefined> {
    if (!instruction) {
      return
    }

    this.state.instruction = instruction

    if (!this.state.buildRequestCode || !this.state.handleResponseCode) {
      ctx.ui.useToast().show('warning', 'Please fill in the Build Request Code and Handle Response Code')
      return
    }

    const buildRequestFn = new AsyncFunction('data', 'env', this.state.buildRequestCode)
    const handleResultFn = new AsyncFunction('data', 'env', this.state.handleResponseCode)

    const controller = new AbortController()
    cancelToken.onCancellationRequested(() => {
      controller.abort()
      Promise.resolve().then(() => {
        updateStatus('') // clear status
      })
    })

    const env = { signal: controller.signal, updateStatus }

    const data = {
      selectedText,
      instruction,
      context: this.state.context,
      system: this.state.withContext ? this.state.systemMessage : '',
      state: this.state,
    }

    const request = await buildRequestFn.apply(this, [data, env])
    if (!request) {
      return null
    }

    const { method, url, headers, body, sse } = request
    this.logger.debug('Request:', url, headers, body, sse)

    if (!sse) {
      const response = await ctx.api.proxyFetch(url, { method, headers, body, signal: controller.signal })
      this.logger.debug('Response:', response)
      const { text } = await handleResultFn.apply(this, [{ res: response, sse: false }, env])
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
          const { delta, done, text: _text } = await handleResultFn.apply(this, [{ res: data, sse: true }, env])

          if (done) {
            throw new FatalError('DONE')
          }

          if (_text) {
            text = _text
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

  adapter: CustomAdapter

  logger: ReturnType<typeof ctx.utils.getLogger>
  monaco = ctx.editor.getMonaco()

  state = reactive({
    __buildRequestCodeChanged: false,
    __handleResponseCodeChanged: false,
    instruction: '',
    proxy: '',
    apiToken: '',
    endpoint: '',
    model: '',
    width: 512,
    height: 512,
    buildRequestCode: '',
    handleResponseCode: '',
  })

  panel: Panel

  constructor (adapter: CustomAdapter) {
    this.adapter = adapter
    this.id = adapter.name
    this.displayname = adapter.name
    this.description = 'Custom Text to Image Adapter'
    this.logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CustomTextToImageAdapter.' + this.id)

    const { buildRequestCode, handleResponseCode } = this.getDefaultCode()

    this.panel = {
      type: 'form',
      items: [
        { type: 'instruction', key: 'instruction', label: i18n.t('instruction'), hasError: v => !v },
        { type: 'input', key: 'endpoint', label: i18n.t('endpoint'), props: { placeholder: '' }, defaultValue: '', hasError: v => !v },
        { type: 'input', key: 'apiToken', label: i18n.t('api-token'), props: { placeholder: '', type: 'password' } },
        { type: 'input', key: 'model', label: i18n.t('model'), props: { placeholder: '' }, defaultValue: '', hasError: v => !v },
        { type: 'range', key: 'width', label: i18n.t('width'), defaultValue: 512, min: 1, max: 1920, step: 1 },
        { type: 'range', key: 'height', label: i18n.t('height'), defaultValue: 512, min: 1, max: 1920, step: 1 },
        { type: 'textarea', key: 'buildRequestCode', advanced: true, label: 'Build Request Code', defaultValue: buildRequestCode, marked: v => v !== buildRequestCode, hasError: v => !v, props: { style: { height: '10em' } } },
        { type: 'textarea', key: 'handleResponseCode', advanced: true, label: 'Handle Response Code', defaultValue: handleResponseCode, marked: v => v !== handleResponseCode, hasError: v => !v, props: { style: { height: '10em' } } },
        { type: 'input', key: 'proxy', label: i18n.t('proxy'), props: { placeholder: 'eg: http://127.0.0.1:8000' } },
      ],
    }

    this.state.buildRequestCode = buildRequestCode
    this.state.handleResponseCode = handleResponseCode

    const adapterPreset = customAdapterPresets[this.type][this.adapter.preset]

    if (adapterPreset?.processAdapter) {
      adapterPreset.processAdapter(this)
    }
  }

  activate () {
    const { buildRequestCode, handleResponseCode } = this.getDefaultCode()

    let stopWatch: () => void

    nextTick(() => {
      if (!this.state.__buildRequestCodeChanged) {
        this.state.buildRequestCode = buildRequestCode
      }

      if (!this.state.__handleResponseCodeChanged) {
        this.state.handleResponseCode = handleResponseCode
      }

      stopWatch = watch(() => [this.state.buildRequestCode, this.state.handleResponseCode], () => {
        this.state.__buildRequestCodeChanged = this.state.buildRequestCode.trim() !== buildRequestCode
        this.state.__handleResponseCodeChanged = this.state.handleResponseCode.trim() !== handleResponseCode
      })
    })

    return {
      dispose: () => {
        stopWatch()
      },
      state: this.state
    }
  }

  getDefaultCode () {
    const adapterPreset = customAdapterPresets[this.type][this.adapter.preset]

    const buildRequestCode = (adapterPreset?.requestCode || '').trim()
    const handleResponseCode = (adapterPreset?.responseCode || '').trim()

    return { buildRequestCode, handleResponseCode }
  }

  async fetchTextToImageResults (instruction: string, cancelToken: CancellationToken, updateStatus: (status: string) => void): Promise<Blob | null | undefined> {
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
    const handleResultFn = new AsyncFunction('data', 'env', this.state.handleResponseCode)

    const data = { state: this.state }
    const env = { gradio, signal: controller.signal, updateStatus }

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
    const { blob } = await handleResultFn.apply(this, [{ res: response }, env])
    return blob
  }
}

export async function createCustomAdapter (type: AdapterType) : Promise<string> {
  if (!ctx.api.proxyFetch) {
    ctx.ui.useToast().show('warning', i18n.t('runtime-version-not-satisfies'))
    throw new Error('Runtime version not satisfies')
  }

  const presets = customAdapterPresets[type]

  const adapterPresetName = ref<CustomAdapterPresetName>(type === 'text2image' ? 'gradio' : 'openai')
  const adapterParamsName = ref('')

  const DialogComponent = defineComponent({
    setup () {
      const preset = computed(() => presets[adapterPresetName.value])
      const params = computed(() => preset.value?.params() || {})

      watch(params, () => {
        // choose the first params by default
        adapterParamsName.value = params.value ? Object.keys(params.value)[0] : ''
      }, { immediate: true })

      return () => h('div', { style: 'margin-top: 16px' }, [
        h('div', { style: 'margin: 8px 0' }, [
          i18n.t('custom-adapter-type'),
          Object.entries(presets).map(([key, { displayName }]) =>
            h('label', { style: 'margin-left: 8px' }, [
              h('input', { type: 'radio', name: 'type', value: key, checked: adapterPresetName.value === key, onChange: () => { adapterPresetName.value = key as any } }),
              ' ' + displayName()]
            ),
          ),
        ]),
        h('div', { style: { margin: '8px 0', display: Object.keys(params.value).length > 1 ? 'block' : 'none' } }, [
          i18n.t('custom-adapter-params'),
          h(
            'select',
            { style: 'margin-left: 8px', value: adapterParamsName.value, onChange: e => { adapterParamsName.value = e.target.value } },
            Object.entries(params.value).map(([key, { displayName }]) => h('option', { value: key }, displayName))
          ),
        ]),
      ])
    }
  })

  const name = await ctx.ui.useModal().input({
    title: i18n.t('create-custom-adapter'),
    hint: i18n.t('adapter-name'),
    value: 'Custom Adapter',
    modalWidth: '500px',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    maxlength: 32,
    component: DialogComponent,
    select: true,
  })

  if (!name) throw new Error('No name')

  if (adapterPresetName.value === 'gradio' && runtimeVersionSatisfies('<3.75.1')) {
    ctx.ui.useToast().show('warning', i18n.t('runtime-version-not-satisfies'))
    throw new Error('Runtime version not satisfies')
  }

  const adapters = getAllAdapters(type)

  if (adapters.some(x => x.id === name || x.displayname === name)) {
    ctx.ui.useToast().show('warning', i18n.t('adapter-name-exists'))
    throw new Error('Adapter name exists')
  }

  addCustomAdapters(
    { name, type: type, preset: adapterPresetName.value },
    presets[adapterPresetName.value]?.params()?.[adapterParamsName.value]?.params || {},
  )

  return name
}
