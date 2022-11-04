import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'
import type { Mermaid } from 'mermaid'

export async function getMermaidLib (): Promise<Mermaid> {
  const iframe = await ctx.view.getRenderIframe()
  const mermaid = (iframe.contentWindow as any).mermaid
  if (mermaid && mermaid.mermaidAPI) {
    return mermaid
  }

  return new Promise((resolve, reject) => {
    const src = getExtensionBasePath(__EXTENSION_ID__) + '/dist/mermaid.min.js'
    // after 3.40.0 use iframe to render
    ctx.view.addScript(src).then(script => {
      script.onerror = reject
      script.onload = () => {
        ctx.view.getRenderIframe().then(iframe => {
          initMermaidTheme()
          resolve((iframe.contentWindow as any).mermaid)
        })
      }
    })
  })
}

export async function initMermaidTheme (colorScheme?: 'light' | 'dark') {
  colorScheme ??= ctx.theme.getColorScheme()
  const theme: any = {
    light: 'default',
    dark: 'dark',
  }[colorScheme]

  const mermaid = await getMermaidLib()

  if (mermaid.mermaidAPI.getConfig().theme === theme) {
    return
  }

  mermaid.mermaidAPI.initialize({ theme })
}
