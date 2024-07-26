/* eslint-disable quote-props */
import { ctx } from '@yank-note/runtime-api'
import { Components } from '@yank-note/runtime-api/types/types/renderer/types'
import type { CancellationTokenSource } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { h, reactive, ref, shallowRef, watch } from 'vue'
import { registerAdapter, removeAdapter, type AdapterType } from './adapter'
import { CustomCompletionAdapter, CustomEditAdapter, CustomTextToImageAdapter } from './custom-adapter'

export const COMPLETION_ACTION_NAME = __EXTENSION_ID__ + '.inlineSuggest.trigger'
export const EDIT_ACTION_NAME = __EXTENSION_ID__ + '.edit.trigger'
export const TEXT_TO_IMAGE_ACTION_NAME = __EXTENSION_ID__ + '.text2image.trigger'

export const CURSOR_PLACEHOLDER = '{CURSOR}'

export const COMPLETION_DEFAULT_SYSTEM_MESSAGE = `## Task: Content Completion, Fill Text at the \`${CURSOR_PLACEHOLDER}\` Position.

### Instructions:
- You are a world class writing assistant.
- Given the current text, context, and the \`${CURSOR_PLACEHOLDER}\` position, provide a suggestion for text completion.
- The suggestion must be based on the current text, as well as the text before the cursor.
- THIS IS NOT A CONVERSATION, SO PLEASE DO NOT ASK QUESTIONS OR PROMPT FOR ADDITIONAL INFORMATION.

### Notes:
- Never include any annotations such as "Suggestion:" or "Suggestions:".
- Never suggest a newline after a space or newline.
- If you do not have a suggestion, return an empty string.
- DO NOT RETURN ANY TEXT THAT IS ALREADY PRESENT IN THE CURRENT TEXT.`

export const EDIT_DEFAULT_SYSTEM_MESSAGE = `## Task: Content Generation/Editing.

### Instructions:
- You are a world class writing assistant.
- Given the current text, context, and the \`${CURSOR_PLACEHOLDER}\` position, provide a suggestion to generate or modify the text.
- The suggestion must be based on the current text, as well as the text before the cursor.
- Generate/Modify Text Based on the CONTEXT at the \`${CURSOR_PLACEHOLDER}\` Position
- Never include any annotations such as "Suggestion:" or "Suggestions:".

--CONTEXT BEGIN--
{CONTEXT}
--CONTEXT END--`

export class FatalError extends Error { }

export interface CustomAdapter {
  name: string,
  type: AdapterType,
  preset: 'openai' | 'custom'
}

export const i18n = ctx.i18n.createI18n({
  en: {
    'ai-complete': 'Complete using AI Copilot',
    'ai-edit': 'Modify Text using AI Copilot',
    'ai-generate': 'Generate Text using AI Copilot',
    'ai-edit-or-gen': 'Edit or Generate Text using AI Copilot',
    'ai-text-to-image': 'Generate Image using AI Copilot',
    'text-to-image': 'Text to Image',
    'enable-ai-copilot': 'Enable AI Copilot',
    'cancel': 'Cancel',
    'accept': 'Accept',
    'copy': 'Copy',
    'rewrite': 'Rewrite',
    'generate': 'Generate',
    'discard': 'Discard',
    'context': 'Context',
    'instruction': 'Instruction',
    'selected-text': 'Selected Text',
    'completion': 'Completion',
    'rewrite-or-generate': 'Rewrite / Generate',
    'proxy': 'Proxy',
    'no-context-available': 'No context available',
    'with-context': 'With context',
    'ask-ai-edit-or-gen': 'Ask Copilot to edit or generate text...',
    'ask-ai-text2image': 'Ask Copilot to generate image...',
    'create-custom-adapter': 'Create Custom adapter',
    'adapter-name': 'adapter Name',
    'adapter-name-exists': 'adapter name already exists',
    'remove': 'Remove',
    'remove-adapter': 'Remove adapter',
    'remove-adapter-confirm': 'Are you sure you want to remove the [%s] adapter?',
    'no-adapters': 'No adapters available',
    'custom-adapter-type': 'Adapter type',
    'custom-adapter-params': 'Adapter params',
    'openai-compatible': 'OpenAI Compatible',
    'custom': 'Custom',
    'endpoint': 'Endpoint',
    'model': 'Model',
    'system-message': 'System Message',
    'api-token': 'API Token',
    'auto-trigger': 'Auto Trigger',
    'auto-trigger-completion-desc': 'Auto trigger completion when typing',
    'reset-to-default': 'Reset to default',
    'reset-to-default-value-confirm': 'Are you sure you want to reset to default value?',
  },
  'zh-CN': {
    'ai-complete': '使用 AI Copilot 自动补全',
    'ai-edit': '使用 AI Copilot 修改文本',
    'ai-generate': '使用 AI Copilot 生成文本',
    'ai-edit-or-gen': '使用 AI Copilot 修改或生成文本',
    'ai-text-to-image': '使用 AI Copilot 生成图片',
    'text-to-image': '文本转图片',
    'enable-ai-copilot': '启用 AI Copilot',
    'cancel': '取消',
    'accept': '接受',
    'copy': '复制',
    'rewrite': '重写',
    'generate': '生成',
    'discard': '放弃',
    'context': '上下文',
    'instruction': '指令',
    'selected-text': '选中文本',
    'completion': '补全文本',
    'rewrite-or-generate': '重写 / 生成',
    'proxy': '代理',
    'no-context-available': '无上下文可用',
    'with-context': '包含上下文',
    'ask-ai-edit-or-gen': '让 Copilot 修改或生成文本...',
    'ask-ai-text2image': '让 Copilot 生成图片...',
    'create-custom-adapter': '创建自定义适配器',
    'adapter-name': '适配器名称',
    'adapter-name-exists': '适配器名称已存在',
    'remove': '移除',
    'remove-adapter': '移除适配器',
    'remove-adapter-confirm': '确定要移除 [%s] 适配器吗？',
    'no-adapters': '无可用适配器',
    'custom-adapter-type': '适配器类型',
    'custom-adapter-params': '适配器参数',
    'openai-compatible': 'OpenAI 兼容',
    'custom': '自定义',
    'endpoint': '端点',
    'model': '模型',
    'system-message': '系统提示',
    'api-token': 'API 密钥',
    'auto-trigger': '自动触发',
    'auto-trigger-completion-desc': '输入时自动触发补全',
    'reset-to-default': '重置为默认值',
    'reset-to-default-value-confirm': '确定要重置为默认值吗？',
  }
})

const defaultState = {
  enable: true,
  type: 'completion' as AdapterType,
  proxy: '',
  adapter: {
    completion: 'openai-completion',
    chat: '',
    edit: 'openai-edit',
    text2image: '',
  },
  instructionHistory: {
    edit: [] as string[],
    text2image: [] as string[],
  },
  adapterState: {} as Record<string, any>,
  customAdapters: [] as CustomAdapter[],
  aiPanelPined: undefined as boolean | undefined,
}

const storageStateKey = __EXTENSION_ID__ + '.state'
const storageData = ctx.utils.storage.get(storageStateKey, defaultState)

const instructionHistory = Array.isArray(storageData.instructionHistory)
  ? { edit: storageData.instructionHistory as string[], text2image: [] }
  : storageData.instructionHistory

if (!Array.isArray(instructionHistory.edit)) {
  instructionHistory.edit = []
}

if (!Array.isArray(instructionHistory.text2image)) {
  instructionHistory.text2image = []
}

export const state = reactive({
  ...defaultState,
  ...storageData,
  instructionHistory: { ...instructionHistory },
})

const saveState = ctx.lib.lodash.debounce(() => {
  ctx.utils.storage.set(storageStateKey, state)
}, 1000, { leading: true })

watch(state, saveState)

function registerCustomAdapter (adapter: CustomAdapter) {
  if (adapter.type === 'completion') {
    registerAdapter(new CustomCompletionAdapter(adapter))
  } else if (adapter.type === 'edit') {
    registerAdapter(new CustomEditAdapter(adapter))
  } else if (adapter.type === 'text2image') {
    registerAdapter(new CustomTextToImageAdapter(adapter))
  }
}

try {
  // register custom adapters
  for (const adapter of state.customAdapters) {
    registerCustomAdapter(adapter)
  }
} catch (error) {
  console.error(error)
}

export const loading = ref(false)
export const globalCancelTokenSource = shallowRef<CancellationTokenSource>()

export function proxyFetch (url: string, reqOptions?: Record<string, any> | undefined, abortSignal?: AbortSignal) {
  if (ctx.api.proxyFetch) {
    return ctx.api.proxyFetch(url, {
      ...reqOptions,
      headers: {
        ...reqOptions?.headers,
        'x-proxy-url': state.proxy
      },
      signal: abortSignal
    })
  }

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

export function showInstructionHistoryMenu (type: AdapterType, setFn: (val: string, clear?: boolean) => void) {
  const list = state.instructionHistory[type]
  const items: Components.ContextMenu.Item[] = list.map(x => ({
    id: x,
    label: h('span', { class: 'ai-copilot-history-instruction-item', title: x }, [
      h('span', x),
      h(ctx.components.SvgIcon, {
        title: 'Remove',
        name: 'times',
        width: '13px',
        height: '13px',
        onClick: (e: MouseEvent) => {
          e.stopPropagation()
          state.instructionHistory[type] = list.filter(y => y !== x)
          setFn(x, true)
          ;(ctx.ui.useContextMenu() as any).hide()
        }
      })
    ]),
    onClick: () => {
      setFn(x)
    }
  }))

  items.push(
    { type: 'separator' },
    {
      id: 'clear',
      label: 'Clear',
      onClick: () => {
        state.instructionHistory[type] = []
      }
    }
  )

  ctx.ui.useContextMenu().show(items)
}

export function buildAdapterStateKey (type: AdapterType, name: string) {
  return `${type}-${name}`
}

export function addCustomAdapters (adapter: CustomAdapter, params: Record<string, any>) {
  registerCustomAdapter(adapter)
  state.customAdapters = ctx.lib.lodash.unionWith(
    [adapter, ...state.customAdapters],
    (a: any, b: any) => a.name === b.name && a.type === b.type
  )

  const adapterKey = buildAdapterStateKey(adapter.type, adapter.name)
  state.adapterState[adapterKey] = { ...state.adapterState[adapterKey], ...params }
}

export function removeCustomAdapter (adapter: Pick<CustomAdapter, 'name' | 'type'>) {
  removeAdapter(adapter.type, adapter.name)
  state.customAdapters = state.customAdapters.filter(x => x.name !== adapter.name || x.type !== adapter.type)
}
