import type Markdown from '@yank-note/runtime-api/types/types/third-party/markdown-it'
import type { ExportType } from '@yank-note/runtime-api/types/types/renderer/types'
import * as echarts from 'echarts'
import { ctx } from '@yank-note/runtime-api'

const { debounce } = ctx.lib.lodash
const { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } = ctx.lib.vue
const { downloadDataURL, getLogger, sleep } = ctx.utils
const { getColorScheme } = ctx.theme
const { registerHook, removeHook } = ctx

const extensionId = __EXTENSION_ID__

const logger = getLogger(extensionId)

export const Echarts = defineComponent({
  name: 'extension-echarts',
  props: {
    attrs: Object,
    code: {
      type: String,
      default: '',
    }
  },
  setup (props) {
    let chart: echarts.ECharts | null = null
    let setOption: echarts.ECharts['setOption']

    const container = ref<HTMLElement>()
    const error = ref<any>()
    const imgSrc = ref('')

    function cleanChart () {
      logger.debug('cleanChart')
      chart?.dispose()
      chart = null
    }

    function render (theme?: 'dark' | 'light', animation?: boolean, img = false) {
      logger.debug('render', { theme, animation, img })

      if (!container.value) {
        cleanChart()
        return
      }

      if (typeof theme === 'string') {
        cleanChart()
      }

      if (!chart) {
        logger.debug('init', theme || getColorScheme())
        chart = echarts.init(container.value, theme || getColorScheme())
        setOption = chart.setOption
      }

      chart.setOption = function (option, ...args: any[]) {
        setOption.call(this, {
          animation: typeof animation === 'boolean' ? animation : true,
          ...option,
        }, ...args)
      }

      try {
        // eslint-disable-next-line
        eval(`(${props.code})(chart)`)
        if (img) {
          imgSrc.value = chart.getDataURL({ type: 'png' })
          cleanChart()
        } else {
          imgSrc.value = ''
        }
      } catch (e: any) {
        error.value = e
        cleanChart()
      }
    }

    const renderDebounce = debounce(render, 400)

    function resize () {
      chart?.resize()
    }

    async function beforeExport ({ type }: { type: ExportType }) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      render('light', false, type !== 'print') // convert to image and set light theme.
      await sleep(0)
      setTimeout(async () => {
        imgSrc.value = ''
        error.value = null
        nextTick(() => render(getColorScheme(), false))
      }, 500) // restore
    }

    function changeTheme () {
      render(getColorScheme())
    }

    const exportData = async (type: 'png') => {
      if (!chart) {
        return
      }

      downloadDataURL(`echarts-${Date.now()}.${type}`, chart.getDataURL({ type, pixelRatio: 2 }))
    }

    watch(() => props.code, () => {
      if (error.value) {
        imgSrc.value = ''
        error.value = null
        nextTick(renderDebounce)
      } else {
        renderDebounce()
      }
    })

    onMounted(() => setTimeout(render, 0))

    registerHook('GLOBAL_RESIZE', resize)
    registerHook('VIEW_BEFORE_EXPORT', beforeExport)
    registerHook('THEME_CHANGE', changeTheme)

    onBeforeUnmount(() => {
      removeHook('GLOBAL_RESIZE', resize)
      removeHook('VIEW_BEFORE_EXPORT', beforeExport)
      removeHook('THEME_CHANGE', changeTheme)
      chart?.dispose()
      chart = null
    })

    return () => {
      if (error.value) {
        return h('pre', {
          class: 'echarts',
          style: 'background: var(--g-color-95); padding: 20px'
        }, `${error.value}\n\n${props.code}`)
      }

      if (imgSrc.value) {
        return h('p', { ...props.attrs }, [
          h('img', { alt: 'echarts', src: imgSrc.value, 'only-child': true })
        ])
      }

      return h('div', { ...props.attrs, class: 'echarts-wrapper' }, [
        h('div', { class: 'echarts-action skip-print' }, [
          h('button', { class: 'small', onClick: () => exportData('png') }, 'PNG'),
        ]),
        h('div', { ref: container, class: 'echarts' }),
      ])
    }
  }
})

export const MarkdownItPlugin = (md: Markdown) => {
  const temp = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]

    const code = token.content.trim()
    const firstLine = code.split(/\n/)[0].trim()
    if (token.info !== 'js' || !firstLine.includes('--echarts--')) {
      return temp(tokens, idx, options, env, slf)
    }

    return h(Echarts, { attrs: token.meta?.attrs, code }) as any
  }
}
