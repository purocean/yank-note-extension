import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'
import type { Mermaid } from 'mermaid'

export async function getMermaidLib (): Promise<Mermaid> {
  const iframe = await ctx.view.getRenderIframe()
  const mermaid = (iframe.contentWindow as any).mermaid
  if (mermaid) {
    return mermaid
  }

  return new Promise((resolve, reject) => {
    const src = getExtensionBasePath(__EXTENSION_ID__) + '/dist/mermaid.min.js'
    // after 3.40.0 use iframe to render
    ctx.view.addScript(src).then(script => {
      script.onerror = reject
      script.onload = () => {
        ctx.view.getRenderIframe().then(iframe => {
          resolve((iframe.contentWindow as any).mermaid)
        })
      }
    })
  })
}