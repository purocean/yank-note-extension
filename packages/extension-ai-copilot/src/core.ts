import { ctx } from '@yank-note/runtime-api'
import type { CancellationTokenSource } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { reactive, ref, shallowRef, watch } from 'vue'

export const COMPLETION_ACTION_NAME = __EXTENSION_ID__ + '.inlineSuggest.trigger'
export const EDIT_ACTION_NAME = __EXTENSION_ID__ + '.edit.trigger'

export const CURSOR_PLACEHOLDER = '{CURSOR}'

export const i18n = ctx.i18n.createI18n({
  en: {
    'ai-complete': 'Complete using AI Copilot',
    'ai-edit': 'Modify using AI Copilot',
    'ai-generate': 'Generate using AI Copilot',
    'ai-edit-or-gen': 'Edit or Generate using AI Copilot',
    'enable-ai-copilot': 'Enable AI Copilot',
  },
  'zh-CN': {
    'ai-complete': '使用 AI Copilot 自动补全',
    'ai-edit': '使用 AI Copilot 修改',
    'ai-generate': '使用 AI Copilot 生成',
    'ai-edit-or-gen': '使用 AI Copilot 修改或生成',
    'enable-ai-copilot': '启用 AI Copilot',
  }
})

const defaultState = {
  enable: true,
  type: 'completion' as 'completion' | 'chat' | 'edit',
  proxy: '',
  adapter: {
    completion: 'openai-completion',
    chat: '',
    edit: 'openai-edit',
  },
  adapterState: {} as Record<string, any>
}

const storageStateKey = __EXTENSION_ID__ + '.state'
export const state = reactive({
  ...defaultState,
  ...ctx.utils.storage.get(storageStateKey, defaultState)
})

const saveState = ctx.lib.lodash.debounce(() => {
  ctx.utils.storage.set(storageStateKey, state)
}, 1000, { leading: true })

watch(state, saveState)

export const loading = ref(false)
export const globalCancelTokenSource = shallowRef<CancellationTokenSource>()

export function proxyRequest (url: string, reqOptions?: Record<string, any> | undefined, abortSignal?: AbortSignal) {
  reqOptions = {
    ...reqOptions,
    proxyUrl: state.proxy
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return ctx.api.proxyRequest(url, reqOptions, true, abortSignal)
}

export async function readReader (
  reader: ReadableStreamDefaultReader,
  onLineReceived: (line: string) => void
): Promise<string> {
  let result = ''
  let currentValue = ''

  // read stream
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      return result
    }

    const val = new TextDecoder().decode(value)

    currentValue += val
    result += val

    const idx = currentValue.lastIndexOf('\n')
    if (idx === -1) {
      continue
    }

    const lines = currentValue.slice(0, idx)
    currentValue = currentValue.slice(idx + 1)

    for (const line of lines.split('\n')) {
      try {
        onLineReceived(line)
      } catch (e) {
        console.error(e)
      }
    }
  }
}
