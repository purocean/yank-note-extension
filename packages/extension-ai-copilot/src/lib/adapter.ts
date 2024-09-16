import type { Ref } from 'vue'
import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'

export type AdapterType = 'completion' | 'edit' | 'text2image'

export type CustomVueComponent = { type: 'custom', component: any }

type _FormItem = CustomVueComponent
  | { type: 'context', key: 'context', label: string, hasError?: (val: string) => boolean, props?: any }
  | { type: 'selection', key: 'selection', label: string, hasError?: (val: string) => boolean, props?: any }
  | { type: 'instruction', key: 'instruction', label: string, hasError?: (val: string) => boolean, defaultValue?: string, props?: any }
  | { type: 'textarea' | 'input', key: string, label: string, description?: string, hasError?: (val: string) => boolean, defaultValue?: string, props?: any }
  | { type: 'select', key: string, label: string, options: {label: string, value: string}[], description?: string, hasError?: (val: string) => boolean, defaultValue?: string, props?: any }
  | { type: 'range', key: string, label: string, max: number, min: number, step: number, description?: string, hasError?: (val: string) => boolean, defaultValue?: number, props?: any }
  | { type: 'checkbox', key: string, label: string, description: string, hasError?: (val: boolean) => boolean, defaultValue?: boolean, props?: any }

export type FormItem = _FormItem & { advanced?: boolean, marked?: (val: string) => boolean }

export type Panel = CustomVueComponent | {
  type: 'form',
  items: Ref<FormItem[]> | FormItem[],
}

export interface Adapter {
  id: string
  type: AdapterType
  displayname: string
  description: string

  removable?: boolean
  panel?: Panel
  state?: Record<string, any>,
  supportProxy?: boolean
  activate(): {
    dispose: () => void,
    state: Record<string, any>
  }
}

export interface CompletionAdapter extends Adapter {
  type: 'completion'
  state: Record<string, any> & { context: string},
  fetchCompletionResults(
    model: Monaco.editor.IModel,
    position: Monaco.Position,
    context: Monaco.languages.InlineCompletionContext,
    cancelToken: Monaco.CancellationToken
  ): Promise<Monaco.languages.InlineCompletions>
}

export interface EditAdapter extends Adapter {
  type: 'edit'
  state: Record<string, any> & { instruction: string, selection: string, context: string, withContext: boolean},
  fetchEditResults(
    selectedText: string,
    instruction: string,
    cancelToken: Monaco.CancellationToken,
    onProgress: (res: { text: string, delta: string }) => void
  ): Promise<string | null | undefined>
}

export interface TextToImageAdapter extends Adapter {
  type: 'text2image'
  state: Record<string, any> & { instruction: string, proxy: string, width: number, height: number },
  fetchTextToImageResults(
    instruction: string,
    cancelToken: Monaco.CancellationToken,
    updateStatus: (status: string) => void
  ): Promise<Blob | null | undefined>
}

const adapters: Record<string, Adapter> = {}

export function getAdapter <T extends AdapterType> (type: T, id: string): (T extends 'completion'
  ? CompletionAdapter
  : T extends 'edit'
    ? EditAdapter
    : T extends 'text2image' ? TextToImageAdapter : never) | undefined {
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

export function removeAdapter (type: AdapterType, id: string) {
  const key = type + '/' + id
  delete adapters[key]
}
