import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

const logger = ctx.utils.getLogger(extensionId)

export const i18n = ctx.i18n.createI18n({
  en: {
    present: 'Present with Reveal.js',
    print: 'Print with Reveal.js',
    fullscreen: 'Fullscreen',
  },
  'zh-CN': {
    present: '使用 Reveal.js 演示',
    print: '使用 Reveal.js 打印',
    fullscreen: '全屏',
  }
})

export function getOpts () {
  return ctx.view.getRenderEnv()?.attributes?.revealJsOpts || {}
}

export function buildHTML (theme: string, init = true) {
  const baseUrl = getExtensionBasePath(extensionId)

  return `
        <link rel="stylesheet" href="${baseUrl}/dist/reset.css">
        <link rel="stylesheet" href="${baseUrl}/dist/reveal.css">
        <link rel="stylesheet" href="${baseUrl}/dist/theme/${theme}.css">
        <link rel="stylesheet" href="${baseUrl}/dist/plugin/highlight/monokai.css">

        <div class="reveal">
          <div id="reveal-slides" class="slides"></div>
        </div>

        <script src="${baseUrl}/dist/reveal.js"></script>
        <script src="${baseUrl}/dist/plugin/highlight/highlight.js"></script>
        <script src="${baseUrl}/dist/plugin/math/math.js"></script>
        ${init ? '<script> initReveal() </script>' : ''}
      `
}

export function getContentHtml () {
  return ctx.view.getContentHtml({
    inlineLocalImage: true,
    includeStyle: true,
  })
}

export async function processReveal (win: Window, opts: Record<string, any>, contentHtml: string | Promise<string>, init: boolean) {
  const content = await contentHtml

  const tmp = document.createElement('div')
  tmp.innerHTML = content

  const slides = win.window.document.getElementById('reveal-slides')
  slides!.innerHTML = tmp.firstElementChild!.innerHTML!

  const Reveal = (win.window as any).Reveal

  if (init) {
    const RevealHighlight = (win.window as any).RevealHighlight
    const RevealMath = (win.window as any).RevealMath
    Reveal.initialize({
      hash: true,
      controls: true,
      center: true,
      ...opts,
      // Learn about plugins: https://revealjs.com/plugins/
      plugins: [RevealHighlight, RevealMath.KaTeX]
    })
  } else {
    const state = Reveal.getState()
    Reveal.sync()
    Reveal.slide(state.indexh, state.indexv, state.indexf)
  }
}

export async function present (print = false) {
  if (!ctx.getPremium()) {
    ctx.ui.useToast().show('info', ctx.i18n.t('premium.need-purchase', extensionId))
    ctx.showPremium()
    throw new Error('Extension requires premium')
  }

  const htmlTitle = ctx.store.state.currentFile?.name || 'Reveal.js'
  const opts = getOpts()
  const theme = opts.theme || 'black'

  const html = buildHTML(theme)

  const url = new URL(location.origin + ctx.embed.buildSrc(html, htmlTitle))
  if (print) {
    url.searchParams.set('print-pdf', 'true')
  }

  await ctx.triggerHook('VIEW_BEFORE_EXPORT', { type: 'html' }, { breakable: true })
  const fileUri = ctx.doc.toUri(ctx.store.state.currentFile)

  const contentPromise = getContentHtml()

  const win = ctx.env.openWindow(url.toString(), '_blank', { alwaysOnTop: false })
  if (!win) {
    throw new Error('Failed to open window')
  }

  (win.window as any).initReveal = async () => {
    processReveal(win, opts, contentPromise, true)

    if (print) {
      setTimeout(() => win.window.print(), 500)
    }
  }

  (win.window as any).updateReveal = async (contentHtml: string) => {
    processReveal(win, opts, contentHtml, false)

    if (print) {
      setTimeout(() => win.window.print(), 500)
    }
  }

  const refreshContent = async ({ doc }) => {
    if (!win || !win.window) {
      logger.debug('remove hook')
      ctx.removeHook('DOC_SAVED', refreshContent)
      return
    }

    if (ctx.doc.toUri(doc) === fileUri) {
      logger.debug('refresh content', fileUri)
      ;(win.window as any).updateReveal(await getContentHtml())
    }
  }

  ctx.registerHook('DOC_SAVED', refreshContent)
}
