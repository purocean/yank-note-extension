import type { Ref } from 'vue'
import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'

export type AdapterType = 'completion' | 'chat' | 'edit'

export type CustomVueComponent = { type: 'custom', component: any }

export type FormItem = CustomVueComponent
  | { type: 'prefix', key: 'prefix', label: string, hasError?: (val: string) => boolean, props?: any }
  | { type: 'suffix', key: 'suffix', label: string, hasError?: (val: string) => boolean, props?: any }
  | { type: 'selection', key: 'selection', label: string, hasError?: (val: string) => boolean, props?: any }
  | { type: 'instruction', key: 'instruction', label: string, historyValueKey: 'historyInstructions', hasError?: (val: string) => boolean, defaultValue?: string, props?: any }
  | { type: 'textarea' | 'input', key: string, label: string, description?: string, historyValueKey?: string, hasError?: (val: string) => boolean, defaultValue?: string, props?: any }
  | { type: 'select', key: string, label: string, options: {label: string, value: string}[], description?: string, hasError?: (val: string) => boolean, defaultValue?: string, props?: any }
  | { type: 'range', key: string, label: string, max: number, min: number, step: number, description?: string, hasError?: (val: string) => boolean, defaultValue?: number, props?: any }

export type Panel = CustomVueComponent | {
  type: 'form',
  items: Ref<FormItem[]> | FormItem[],
}

export interface Adapter {
  id: string
  type: AdapterType
  displayname: string
  description: string

  panel?: Panel
  state?: Record<string, any>,
  activate(): {
    dispose: () => void,
    state?: Record<string, any>
  }
}

export interface CompletionAdapter extends Adapter {
  type: 'completion'
  fetchCompletionResults(
    model: Monaco.editor.IModel,
    position: Monaco.Position,
    context: Monaco.languages.InlineCompletionContext,
    cancelToken: Monaco.CancellationToken
  ): Promise<Monaco.languages.InlineCompletions>
}

export interface ChatAdapter extends Adapter {
  type: 'chat'
  fetchChatResults(): Promise<any>
}

export interface EditAdapter extends Adapter {
  type: 'edit'
  state: Record<string, any> & { instruction: string },
  fetchEditResults(
    selectedText: string,
    instruction: string,
    cancelToken: Monaco.CancellationToken,
    onProgress: (res: { text: string }) => void
  ): Promise<string | null | undefined>
}

const adapters: Record<string, Adapter> = {}

export function getAdapter <T extends AdapterType> (type: T, id: string): (T extends 'completion'
  ? CompletionAdapter
  : T extends 'chat'
    ? ChatAdapter
    : T extends 'edit'
      ? EditAdapter : never) | undefined {
  return adapters[type + '/' + id] as any
}

export function getAllAdapters (type: AdapterType) {
  return Object.values(adapters).filter(x => x.type === type)
}

export function registerAdapter (adapter: Adapter) {
  const key = adapter.type + '/' + adapter.id
  if (adapters[key]) {
    throw new Error(`Adapter ${adapter.id} already registered`)
  }

  adapters[key] = adapter
}
