import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

const logger = ctx.utils.getLogger(extensionId)

export const i18n = ctx.i18n.createI18n({
  en: {
    present: 'Present with Reveal.js',
    print: 'Print with Reveal.js',
    'export-html': 'Export HTML',
    fullscreen: 'Fullscreen',
    'reload-current': 'Reload (Keep Current Slide)',
  },
  'zh-CN': {
    present: '使用 Reveal.js 演示',
    print: '使用 Reveal.js 打印',
    'export-html': '导出 HTML',
    fullscreen: '全屏',
    'reload-current': '重载 (保持当前页)',
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

export function getContentHtml (forExport = false) {
  return ctx.view.getContentHtml({
    useRemoteSrcOfLocalImage: !forExport,
    inlineLocalImage: forExport,
    includeStyle: true,
  })
}

function escapeHtml (value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeStyle (value: string) {
  return value.replace(/<\/style/gi, '<\\/style')
}

function escapeScript (value: string) {
  return value.replace(/<\/script/gi, '<\\/script')
}

async function readAssetText (path: string) {
  const baseUrl = getExtensionBasePath(extensionId)
  const res = await fetch(`${baseUrl}/${path}`)
  if (!res.ok) {
    throw new Error(`Failed to read asset: ${path}`)
  }
  return res.text()
}

function getFileName (ext: string) {
  const name = ctx.store.state.currentFile?.name || 'reveal'
  const oldExt = ctx.utils.path.extname(name)
  return `${ctx.utils.path.basename(name, oldExt)}.${ext}`
}

function getSlidesHtml (content: string) {
  const tmp = document.createElement('div')
  tmp.innerHTML = content
  return tmp.firstElementChild?.innerHTML || content
}

export async function buildStandaloneHTML () {
  const title = ctx.store.state.currentFile?.name || 'Reveal.js'
  const opts = getOpts()
  const theme = opts.theme || 'black'
  const content = await getContentHtml(true)
  const slidesHtml = getSlidesHtml(content)

  const themeCss = await readAssetText(`dist/theme/${theme}.css`).catch(() => readAssetText('dist/theme/black.css'))
  const [
    resetCss,
    revealCss,
    highlightCss,
    revealJs,
    highlightJs,
    mathJs,
  ] = await Promise.all([
    readAssetText('dist/reset.css'),
    readAssetText('dist/reveal.css'),
    readAssetText('dist/plugin/highlight/monokai.css'),
    readAssetText('dist/reveal.js'),
    readAssetText('dist/plugin/highlight/highlight.js'),
    readAssetText('dist/plugin/math/math.js'),
  ])

  const revealOpts = {
    hash: true,
    controls: true,
    center: true,
    ...opts,
  }
  const revealOptsJson = JSON.stringify(revealOpts)

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="generator" content="Yank Note Reveal.js">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
${escapeStyle(resetCss)}
${escapeStyle(revealCss)}
${escapeStyle(themeCss)}
${escapeStyle(highlightCss)}
  </style>
  <style id="reveal-custom-style">
${escapeStyle(opts.customStyle || '')}
  </style>
</head>
<body style="min-height: 100vh;">
  <style>
    html,
    body {
      min-height: 100vh;
    }

    .reveal {
      min-height: 100vh;
      height: 100vh;
    }
  </style>
  <div class="reveal">
    <div class="slides">
${slidesHtml}
    </div>
  </div>
  <script>
${escapeScript(revealJs)}
  </script>
  <script>
${escapeScript(highlightJs)}
  </script>
  <script>
${escapeScript(mathJs)}
  </script>
  <script>
    const revealOptions = ${escapeScript(revealOptsJson)};
    revealOptions.plugins = [RevealHighlight, RevealMath.KaTeX];
    Reveal.initialize(revealOptions);
  </script>
</body>
</html>`
}

export async function exportHTML () {
  const html = await buildStandaloneHTML()
  ctx.utils.downloadContent(getFileName('html'), html, 'text/html')
}

export function getState (win: Window) {
  const Reveal = (win.window as any).Reveal
  return Reveal.getState()
}

export async function processReveal (win: Window, opts: Record<string, any>, contentHtml: string | Promise<string>, init: boolean, state?: any) {
  const content = await contentHtml

  const tmp = document.createElement('div')
  tmp.innerHTML = content

  const slides = win.window.document.getElementById('reveal-slides')
  slides!.innerHTML = tmp.firstElementChild!.innerHTML!

  const Reveal = (win.window as any).Reveal

  if (init) {
    const RevealHighlight = (win.window as any).RevealHighlight
    const RevealMath = (win.window as any).RevealMath
    await Reveal.initialize({
      hash: true,
      controls: true,
      center: true,
      ...opts,
      // Learn about plugins: https://revealjs.com/plugins/
      plugins: [RevealHighlight, RevealMath.KaTeX]
    })

    const style = win.window.document.createElement('style')
    style.id = 'reveal-custom-style'
    style.innerHTML = opts.customStyle || ''
    win.window.document.head.appendChild(style)

    if (state) {
      Reveal.slide(state.indexh, state.indexv, state.indexf)
    }
  } else {
    const state = Reveal.getState()
    Reveal.sync()
    Reveal.slide(state.indexh, state.indexv, state.indexf)
    const RevealHighlight = (win.window as any).RevealHighlight
    RevealHighlight().init({
      getConfig: () => Reveal.getConfig(),
      getRevealElement: () => Reveal.getRevealElement(),
      on: () => 0, // noop
    })

    const style = win.window.document.getElementById('reveal-custom-style')
    if (style) {
      style.innerHTML = opts.customStyle || ''
    }
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

  const fileUri = ctx.doc.toUri(ctx.store.state.currentFile)

  const contentPromise = getContentHtml(print)

  const win = ctx.env.openWindow(url.toString(), '_blank', { alwaysOnTop: false })
  if (!win) {
    throw new Error('Failed to open window')
  }

  (win.window as any).initReveal = async () => {
    processReveal(win, opts, contentPromise, true)

    if (print) {
      setTimeout(() => win.window.print(), 1500)
    }
  }

  (win.window as any).updateReveal = async (contentHtml: string) => {
    processReveal(win, opts, contentHtml, false)

    if (print) {
      setTimeout(() => win.window.print(), 1500)
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
