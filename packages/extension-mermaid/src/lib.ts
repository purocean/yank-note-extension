import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'
import type { Mermaid } from 'mermaid'

export type FileType = '.mmd' | '.mermaid'
export const supportedFileTypes: FileType[] = ['.mmd', '.mermaid']

export const i18n = ctx.i18n.createI18n({
  en: {
    'edit-mermaid-diagram': 'Edit Mermaid Diagram',
    'file-support-error': 'Only support .mmd or .mermaid file',
  },
  'zh-CN': {
    'edit-mermaid-diagram': '编辑 Mermaid 图形',
    'file-support-error': '仅支持 .mmd 或 .mermaid 文件',
  },
})

export async function getMermaidLib (): Promise<Mermaid> {
  const iframe = await ctx.view.getRenderIframe()
  const mermaid = (iframe.contentWindow as any).mermaid

  if (mermaid && (mermaid.mermaidAPI || mermaid.then)) {
    return mermaid
  }

  const promise = new Promise<Mermaid>((resolve, reject) => {
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

  ;(iframe.contentWindow as any).mermaid = promise

  return promise
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

export function supported (path: string) {
  const ext = path && ctx.utils.path.extname(path)
  return !!(ext && supportedFileTypes.includes(ext as FileType))
}
