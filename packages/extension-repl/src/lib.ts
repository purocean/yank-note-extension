import { getExtensionBasePath, ctx } from '@yank-note/runtime-api'
import type { Doc, RenderEnv } from '@yank-note/runtime-api/types/types/renderer/types'
import type Markdown from '@yank-note/runtime-api/types/types/third-party/markdown-it'

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

export const MarkdownItPlugin = (md: Markdown) => {
  const temp = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env: RenderEnv, slf) => {
    const token = tokens[idx]

    const code = token.content.trim()
    const firstLine = code.split(/\n/)[0].trim()
    if (token.info !== 'vue' || !firstLine.includes('--applet--') || env.safeMode) {
      return temp(tokens, idx, options, env, slf)
    }

    const appletTitle = firstLine.replace('<!--', '').replace('-->', '').replace('--applet--', '').trim()

    function onload () {
      const frame = this as HTMLIFrameElement
      const resize = (height: number) => {
        frame.height = Math.ceil(height) + 'px'
      }

      const win = frame.contentWindow as any
      // inject vars.
      win.resize = resize
    }

    const iframe = ctx.lib.vue.h('iframe', {
      ...token.meta?.attrs,
      style: 'width: 100%; border: none; display: block;',
      height: '50px',
      src: buildEditorUrl() + '#vue-sfc-code=' + encodeURIComponent(code),
      onload,
    })

    if (!appletTitle) {
      return iframe
    }

    return ctx.lib.vue.h('fieldset', { class: 'extension-repl-applet-wrapper' }, [
      ctx.lib.vue.h('legend', {}, `Applet: ${appletTitle}`),
      ctx.lib.vue.h('div',
        { class: 'extension-repl-applet' },
        iframe,
      )
    ]) as any
  }
}
