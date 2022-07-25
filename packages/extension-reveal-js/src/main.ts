import { getExtensionBasePath, registerPlugin } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    const i18n = ctx.i18n.createI18n({
      en: {
        present: 'Present with Reveal.js',
        print: 'Print with Reveal.js',
      },
      'zh-CN': {
        present: '使用 Reveal.js 演示',
        print: '使用 Reveal.js 打印',
      }
    })

    const logger = ctx.utils.getLogger(extensionId)

    async function present (print = false) {
      if (!ctx.getPremium()) {
        ctx.ui.useToast().show('info', ctx.i18n.t('premium.need-purchase', extensionId))
        ctx.showPremium()
        throw new Error('Extension requires premium')
      }

      const baseUrl = getExtensionBasePath(extensionId)

      const htmlTitle = ctx.store.state.currentFile?.name || 'Reveal.js'
      const opts = ctx.view.getRenderEnv()?.attributes?.revealJsOpts || {}
      const theme = opts.theme || 'black'

      const html = `
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
        <script> initReveal() </script>
      `

      const url = new URL(location.origin + ctx.embed.buildSrc(html, htmlTitle))
      if (print) {
        url.searchParams.set('print-pdf', 'true')
      }

      await ctx.triggerHook('DOC_BEFORE_EXPORT', { type: 'html' }, { breakable: true })
      const fileUri = ctx.doc.toUri(ctx.store.state.currentFile)

      const getContentPromise = () => ctx.view.getContentHtml({
        inlineLocalImage: true,
        includeStyle: true,
      })

      const contentPromise = getContentPromise()

      const win = ctx.env.openWindow(url.toString(), '_blank', { alwaysOnTop: false })
      if (!win) {
        throw new Error('Failed to open window')
      }

      (win.window as any).initReveal = async (contentHtml?: string) => {
        const content = contentHtml || await contentPromise

        const tmp = document.createElement('div')
        tmp.innerHTML = content

        const slides = win.window.document.getElementById('reveal-slides')
        slides!.innerHTML = tmp.firstElementChild!.innerHTML!

        // update content only
        if (contentHtml) {
          return
        }

        const Reveal = (win.window as any).Reveal
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
          const Reveal = (win.window as any).Reveal
          ;(win.window as any).initReveal(await getContentPromise())
          const state = Reveal.getState()
          Reveal.sync()
          Reveal.slide(state.indexh, state.indexv, state.indexf)
        }
      }

      ctx.registerHook('DOC_SAVED', refreshContent)
    }

    ctx.statusBar.tapMenus(menus => {
      menus['status-bar-tool']?.list?.push(
        { type: 'separator', order: 999 },
        {
          id: extensionId + '-present',
          type: 'normal',
          title: i18n.t('present'),
          onClick: () => present(),
          order: 999,
        },
        {
          id: extensionId + '-print',
          type: 'normal',
          title: i18n.t('print'),
          onClick: () => present(true),
          order: 999,
        }
      )
    })
  }
})
