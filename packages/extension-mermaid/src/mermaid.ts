import type Markdown from '@yank-note/runtime-api/types/types/third-party/markdown-it'
import { ctx } from '@yank-note/runtime-api'
import { getMermaidLib } from './lib'

const { registerHook, removeHook } = ctx
const { debounce } = ctx.lib.lodash
const { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } = ctx.lib.vue
const { downloadDataURL, getLogger, strToBase64 } = ctx.utils
const DomToImage = ctx.lib.domtoimage

const extensionId = __EXTENSION_ID__

const logger = getLogger(extensionId)

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

let mid = 1

const Mermaid = defineComponent({
  name: 'extension-mermaid',
  props: {
    attrs: Object,
    code: {
      type: String,
      default: ''
    }
  },
  setup (props) {
    const container = ref<HTMLElement>()
    const imgRef = ref<HTMLImageElement>()
    const result = ref('')
    const img = ref('')
    const errMsg = ref('')

    function getImageUrl (code?: string) {
      const svg = code || container.value?.innerHTML
      if (!svg) {
        return ''
      }

      return 'data:image/svg+xml;base64,' + strToBase64(svg)
    }

    async function render () {
      logger.debug('render', props.code)
      const mermaid = await getMermaidLib()
      try {
        mermaid.render(`mermaid-${mid++}`, props.code, (svgCode: string) => {
          result.value = svgCode
          errMsg.value = ''
          img.value = getImageUrl(svgCode)
        }, container.value)
      } catch (error) {
        errMsg.value = error.str || String(error)
        logger.error('render', error)
      }
    }

    function exportSvg () {
      const url = imgRef.value?.src
      if (!url) {
        return
      }

      downloadDataURL(`mermaid-${Date.now()}.svg`, url)
    }

    async function exportPng () {
      if (!imgRef.value) {
        return
      }

      const width = imgRef.value.clientWidth
      const height = imgRef.value.clientHeight

      const dataUrl = await DomToImage
        .toPng(imgRef.value, { width: width * 2, height: height * 2 })

      downloadDataURL(`mermaid-${Date.now()}.png`, dataUrl)
    }

    async function beforeDocExport () {
      initMermaidTheme('light')
      await render()
      setTimeout(async () => {
        await initMermaidTheme()
        await render()
      }, 500)
    }

    const renderDebounce = debounce(render, 100)

    watch(() => props.code, renderDebounce)

    onMounted(() => render())

    registerHook('THEME_CHANGE', renderDebounce)
    registerHook('VIEW_BEFORE_EXPORT', beforeDocExport)
    onBeforeUnmount(() => {
      removeHook('THEME_CHANGE', renderDebounce)
      removeHook('VIEW_BEFORE_EXPORT', beforeDocExport)
    })

    return () => {
      return h('div', { ...props.attrs, class: `mermaid-wrapper${errMsg.value ? ' error' : ''}` }, [
        h('div', { class: 'mermaid-action skip-print' }, [
          h('button', { class: 'small', onClick: exportSvg }, 'SVG'),
          h('button', { class: 'small', onClick: exportPng }, 'PNG'),
        ]),
        h('div', {
          ref: container,
          key: props.code,
          class: 'mermaid-container skip-export',
        }),
        h('img', {
          src: img.value,
          ref: imgRef,
          alt: 'mermaid',
          class: 'mermaid-image',
        }),
        h('pre', { class: 'mermaid-error skip-export' }, errMsg.value)
      ])
    }
  }
})

export const MarkdownItPlugin = (md: Markdown) => {
  const temp = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]
    const code = token.content.trim()
    if (token.info === 'mermaid') {
      return h(Mermaid, { attrs: token.meta?.attrs, code }) as any
    }

    const firstLine = code.split(/\n/)[0].trim()
    if (firstLine === 'gantt' || firstLine === 'sequenceDiagram' || firstLine.match(/^graph (?:TB|BT|RL|LR|TD);?$/)) {
      return h(Mermaid, { attrs: token.meta?.attrs, code }) as any
    }

    return temp(tokens, idx, options, env, slf)
  }
}
