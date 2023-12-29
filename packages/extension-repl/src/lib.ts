import { getExtensionBasePath, ctx } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'

const supportedFileTypes = ['.vueapp.zip']

export const CUSTOM_EDITOR_IFRAME_ID = 'custom-repl-editor-iframe'

export function supported (doc?: Doc | null) {
  return !!(doc && supportedFileTypes.some(type => doc.path.endsWith(type)))
}

export function getEditorPath (path?: string) {
  return ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), 'editor', path || '')
}

export function buildEditorUrl (file: Doc) {
  const search = new URLSearchParams({ name: file.name, path: file.path, repo: file.repo })
  return getEditorPath('index.html') + '?' + search.toString()
}
