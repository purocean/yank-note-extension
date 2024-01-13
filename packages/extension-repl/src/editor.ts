import { createApp, defineAsyncComponent, h, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { Repl } from '@vue/repl'
import { BaseCustomEditorContent } from '@yank-note/runtime-api'
import Editor from '@vue/repl/codemirror-editor'
import { base64ToVueProject, replStoreToVueProject, vueProjectToBase64, vueProjectToReplStore } from './vue/helper'

class EditorContent extends BaseCustomEditorContent {
  logger = this.ctx.utils.getLogger('repl-editor')

  contentType: string
  save = () => Promise.resolve()

  VueRepl = defineAsyncComponent(async () => {
    const fileBase64 = await this.io.read(true)
    const project = await base64ToVueProject(fileBase64)
    const store = await vueProjectToReplStore(project)

    const theme = ref<'dark' | 'light'>(this.ctx.theme.getColorScheme())
    const refreshTheme = () => {
      theme.value = this.ctx.theme.getColorScheme()
    }

    this.ctx.registerHook('THEME_CHANGE', refreshTheme)
    onBeforeUnmount(() => {
      this.ctx.removeHook('THEME_CHANGE', refreshTheme)
    })

    watchEffect(() => {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add(theme.value)
    })

    this.io.setStatus('loaded')

    watch(() => store.serialize(), () => {
      this.io.setStatus('unsaved')
      this.save = async () => {
        const project = replStoreToVueProject(store)
        const content = await vueProjectToBase64(project)
        await this.io.write(content, true)
        this.io.setStatus('saved')
      }

      this.triggerAutoSave()
    })

    return () => h(Repl, {
      store,
      editor: Editor,
      theme: theme.value,
      previewOptions: {
        customCode: {
          useCode: `window.useYnCtx = (opts) => {
            const ctx = window.parent.ctx

            document.documentElement.setAttribute('app-theme', document.documentElement.className)

            if (!window._themeObserve) {
              window._themeObserve = new MutationObserver(() => {
                if (document.documentElement.className !== document.documentElement.getAttribute('app-theme')) {
                  document.documentElement.setAttribute('app-theme', document.documentElement.className)
                }
              })

              window._themeObserve.observe(document.documentElement, { attributes: true })
            }

            if ((!opts || !opts.injectGlobalCss) && window._globalCssLink) {
              window._globalCssLink.remove()
              window._globalCssLink = null
            }

            if (opts && opts.injectGlobalCss && !window._globalCssLink) {
              const globalCssHref = [...window?.parent?.parent?.document?.styleSheets]
              .find(x => x.href && x.href.match(/assets\\/api-[^.]+.css/))?.href

              if (globalCssHref) {
                const link = document.createElement('link')
                link.href = globalCssHref
                link.rel = 'stylesheet'
                document.head.appendChild(link)

                window._globalCssLink = link
              }
            }

            return ctx
          }`,
        },
      }
    })
  })

  init () {
    const app = window.document.getElementById('app')!
    createApp(this.VueRepl).mount(app)
  }
}

const editorContent = new EditorContent()
editorContent.init()
