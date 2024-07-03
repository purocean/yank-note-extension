import { getExtensionBasePath, ctx } from '@yank-note/runtime-api'
import type { Doc, RenderEnv } from '@yank-note/runtime-api/types/types/renderer/types'
import type Markdown from '@yank-note/runtime-api/types/types/third-party/markdown-it'

export const FILE_BASE64 = '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'

export function getEditorPath (path?: string) {
  return ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), 'editor', path || '')
}

export function buildEditorUrl (file?: Doc) {
  const htmlPath = getEditorPath('index.html')

  if (file) {
    const search = new URLSearchParams({ name: file.name, path: file.path, repo: file.repo })
    return htmlPath + '?' + search.toString()
  }

  return htmlPath
}

export function MarkdownItPlugin (md: Markdown) {
  const h = ctx.lib.vue.h

  const render = ({ url, env }: any) => {
    const currentFile = (env as RenderEnv).file!
    let path: string
    if (url.startsWith('/api/attachment/')) {
      const params = new URLSearchParams(url.replace(/^.*\?/, ''))
      path = params.get('path') || ''
    } else {
      const basePath = ctx.utils.path.dirname(currentFile.path)
      path = ctx.utils.path.resolve(basePath, decodeURIComponent(url))
    }

    const src = buildEditorUrl({ type: 'file', repo: currentFile.repo, path, name: ctx.utils.path.basename(path) }) + '&embedded=true'

    return h('iframe', { key: src, src, style: 'display: block; width: 100%; height: 400px; border: none' })
  }

  const linkTemp = md.renderer.rules.link_open!.bind(md.renderer.rules)
  md.renderer.rules.link_open = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]

    const url = token.attrGet('href') || ''
    if (token.attrGet('link-type') !== 'geogebra' || !url || !(env as RenderEnv).file) {
      return linkTemp(tokens, idx, options, env, slf)
    }

    const nextToken = tokens[idx + 1]
    if (nextToken && nextToken.type === 'text') {
      nextToken.content = ''
    }

    return render({ url, env }) as any
  }
}
