import { getExtensionBasePath, ctx } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'

export function getEditorPath (path?: string) {
  return ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), 'editor', path || '')
}

export function buildEditorUrl (file: Doc) {
  const search = new URLSearchParams({ name: file.name, path: file.path, repo: file.repo })
  return getEditorPath('index.html') + '?' + search.toString()
}
