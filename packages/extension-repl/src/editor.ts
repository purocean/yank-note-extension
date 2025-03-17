import { createApp, defineAsyncComponent, defineComponent, h, onBeforeUnmount, provide, ref, watch, watchEffect } from 'vue'
import { Preview, Repl } from '@vue/repl'
import { BaseCustomEditorContent, Ctx } from '@yank-note/runtime-api'
import Editor from '@vue/repl/codemirror-editor'
import { base64ToVueProject, getDefaultReplStore, replStoreToVueProject, vueProjectToBase64, vueProjectToReplStore } from './vue/helper'

const useCode = `window.useYnCtx = (opts) => {
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
}`

function getVueSfcCode () {
  const query = new URLSearchParams(location.hash)
  return query.get('#vue-sfc-code')
}

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
        customCode: { useCode },
      }
    })
  })

  init () {
    const app = window.document.getElementById('app')!
    createApp(this.VueRepl).mount(app)
  }
}

class Previewer {
  ctx: Ctx = (window as any).ctx
  VueRepl = defineComponent(() => {
    const store = getDefaultReplStore()

    const updateCode = () => {
      const code = getVueSfcCode()
      if (code) {
        store.state.activeFile.code = code
      }
    }

    updateCode()
    store.init()

    const theme = ref<'dark' | 'light'>(this.ctx.theme.getColorScheme())
    const refreshTheme = () => {
      theme.value = this.ctx.theme.getColorScheme()
    }

    const debounceUpdateCode = this.ctx.lib.lodash.debounce(updateCode, 800)

    window.addEventListener('hashchange', debounceUpdateCode)

    this.ctx.registerHook('THEME_CHANGE', refreshTheme)
    onBeforeUnmount(() => {
      this.ctx.removeHook('THEME_CHANGE', refreshTheme)
      window.removeEventListener('hashchange', debounceUpdateCode)
    })

    watchEffect(() => {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add(theme.value)
    })

    watchEffect(() => {
      const errors = store.state.errors.map(x => String(x)).join('')
      const iframe = document.querySelector('.iframe-container>iframe') as HTMLIFrameElement
      const win: any = iframe?.contentWindow
      if (errors.trim() && win) {
        setTimeout(() => {
          if (window.document.body.scrollHeight < 200) {
            win.resize(200)
          }
          win._console.error(errors)
        }, 500)
      }
    })

    const previewOptions = {
      headHTML: '<style>html > body { padding: 0; margin: 0; display: flow-root; }</style>',
      customCode: {
        importCode: `
          window._console = console;
          window.resize = (h) => {
            const height = h || window.document.body.scrollHeight
            window.parent.resize(height)
          }
        `, // expose console use for display complier error.
        useCode: `
          ${useCode}
          setTimeout(window.resize, 0);
          setTimeout(window.resize, 100);
          setTimeout(window.resize, 500);
        `
      },
    }

    provide('store', store)
    provide('theme', theme)
    provide('preview-options', previewOptions)
    provide('clear-console', ref(false))

    return () => h(Preview, { ssr: false, show: true })
  })

  init () {
    const app = window.document.getElementById('app')!
    createApp(this.VueRepl).mount(app)
  }
}

if (getVueSfcCode()) {
  const previewer = new Previewer()
  previewer.init()
} else {
  const editorContent = new EditorContent()
  editorContent.init()
}
