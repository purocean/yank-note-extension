import type Markdown from '@yank-note/runtime-api/types/types/third-party/markdown-it'
import { ctx } from '@yank-note/runtime-api'
import { getMermaidLib, i18n, initMermaidTheme, supported } from './lib'
import type { PathItem } from '@yank-note/runtime-api/types/types/share/types'

const { registerHook, removeHook } = ctx
const { debounce } = ctx.lib.lodash
const { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } = ctx.lib.vue
const { downloadDataURL, getLogger, strToBase64 } = ctx.utils

const extensionId = __EXTENSION_ID__

const loadingImg = 'data:image/gif;base64,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'

const logger = getLogger(extensionId)

let mid = 1

const Mermaid = defineComponent({
  name: 'extension-mermaid',
  props: {
    attrs: Object,
    code: {
      type: String,
      default: ''
    },
    file: Object as () => PathItem,
  },
  setup (props) {
    const container = ref<HTMLElement>()
    const imgRef = ref<HTMLImageElement>()
    const result = ref('')
    const img = ref(loadingImg)
    const errMsg = ref('')

    function getImageUrl (code?: string) {
      let svg = code || container.value?.innerHTML
      if (!svg) {
        return ''
      }

      svg = svg.replace(/<\/(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)>/g, '')
        .replace(/<(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)([^>]*)>/g, '<$1$2/>')

      return 'data:image/svg+xml;base64,' + strToBase64(svg)
    }

    async function render () {
      try {
        let code = props.code

        if (!code && props.file) {
          if (!supported(props.file.path)) {
            throw new Error(i18n.t('file-support-error'))
          }

          const res = await ctx.api.readFile(props.file)
          code = res.content
        }

        logger.debug('render', code)

        const mermaid = await getMermaidLib()
        let { svg } = await mermaid.render(`mermaid-${mid++}`, code, container.value)
        // get max width
        const width = svg.match(/style="max-width: ([\d.]+px);"/)?.[1]
        if (width) {
          svg = svg.replace('width="100%"', `width="${width}"`)
        }
        result.value = svg
        errMsg.value = ''
        img.value = getImageUrl(svg)
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

      const canvas = document.createElement('canvas')
      canvas.width = width * 2
      canvas.height = height * 2
      canvas.getContext('2d')?.drawImage(imgRef.value, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/png')

      downloadDataURL(`mermaid-${Date.now()}.png`, dataUrl)
    }

    async function beforeDocExport () {
      initMermaidTheme('light')
      await render()
    }

    async function afterDocExport () {
      await initMermaidTheme()
      await render()
    }

    const renderDebounce = debounce(render, 100)

    watch(() => [props.code, props.file], renderDebounce)

    let observer: ResizeObserver | null = null

    onMounted(async () => {
      await render()

      let width = 0
      observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry) return

        if (!width) {
          width = entry.contentRect.width
          return
        }

        logger.error('container resize', entry.contentRect.width)

        if (entry.contentRect.width !== width) {
          width = entry.contentRect.width
          renderDebounce()
        }
      })

      observer.observe(container.value!)
    })

    registerHook('THEME_CHANGE', renderDebounce)
    registerHook('EXPORT_BEFORE_PREPARE', beforeDocExport)
    registerHook('EXPORT_AFTER_PREPARE', afterDocExport)
    onBeforeUnmount(() => {
      removeHook('THEME_CHANGE', renderDebounce)
      removeHook('EXPORT_BEFORE_PREPARE', beforeDocExport)
      removeHook('EXPORT_AFTER_PREPARE', afterDocExport)

      observer?.disconnect()
    })

    return () => {
      return h('div', { ...props.attrs, class: `mermaid-wrapper${errMsg.value ? ' error' : ''}` }, [
        h('div', { class: 'mermaid-action skip-print' }, [
          h('button', { class: 'small', onClick: exportSvg }, 'SVG'),
          h('button', { class: 'small', onClick: exportPng }, 'PNG'),
        ]),
        h('div', {
          ref: container,
          key: props.code || props.file?.path,
          class: 'mermaid-container skip-export',
        }),
        h('img', {
          src: img.value,
          ref: imgRef,
          'data-repo': props.file?.repo,
          'data-path': props.file?.path,
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

  const linkTemp = md.renderer.rules.link_open!.bind(md.renderer.rules)
  md.renderer.rules.link_open = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]

    if (token.attrGet('link-type') !== 'mermaid') {
      return linkTemp(tokens, idx, options, env, slf)
    }

    const path = token.attrGet('target-path')
    const repo = token.attrGet('target-repo')

    if (!path || !repo) {
      return linkTemp(tokens, idx, options, env, slf)
    }

    const nextToken = tokens[idx + 1]
    if (nextToken && nextToken.type === 'text') {
      nextToken.content = ''
    }

    return h(Mermaid, { file: { repo, path } })
  }
}
