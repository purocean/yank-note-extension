<template>
  <p v-if="img"><img :src="img" only-child="true" /></p>
  <component :is="fence ? 'div' : Fragment" :class="{'markmap-preview': true, 'skip-export': true, hidden: !!img}">
    <div class="markmap-preview-action">
      <button class="btn small" @click="downloadSvg">SVG</button>
      <button class="btn small" @click="downloadPng">PNG</button>
      <button class="btn small" @click="init">{{_$t('reload')}}</button>
      <button class="btn small" @click="newWindow">{{_$t('open-in-new-window')}}</button>
    </div>
    <iframe
      v-if="src"
      ref="iframe"
      :onload="onIframeLoad"
      :src="src"
      frameborder="0"
      width="100%"
      height="100%" />
  </component>
</template>

<script lang="ts" setup>
import { ctx } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/share/types'
import type MarkdownIt from '@yank-note/runtime-api/types/types/third-party/markdown-it'
import type { Markmap } from 'markmap-view'
import type { ITransformHooks, Transformer } from 'markmap-lib'
import { buildHTML, linkApi, wikiLinksApi } from './helper'

const RULE_NAME = 'wiki-links'
const logger = ctx.utils.getLogger('markmap-previewer')
const Fragment = ctx.lib.vue.defineComponent({
  setup (_, { slots }) {
    return () => slots.default?.()
  }
})

const img = ctx.lib.vue.ref('')
const src = ctx.lib.vue.ref('')
const iframe = ctx.lib.vue.ref<HTMLIFrameElement>()
const { $t: _$t } = ctx.i18n.useI18n()

// eslint-disable-next-line no-undef
const props = defineProps({
  file: {
    type: Object as () => Doc,
    require: true,
  },
  source: {
    type: String,
    required: true,
  },
  fence: {
    type: Boolean,
    required: true,
  },
})

function newWindow () {
  const html = buildHTML()
  const src = ctx.embed.buildSrc(html, 'Markmap')
  const win = ctx.env.openWindow(src, '_blank')
  if (win && win.window) {
    win.window.onload = () => {
      onLoad(win.window)
    }
  }
}

function render (win?: Window) {
  logger.debug('render')

  const content = props.source || ''
  const _win = win || iframe.value?.contentWindow
  if (_win) {
    const enableWikiLinks = ctx.setting.getSetting('render.md-wiki-links', true)

    if (enableWikiLinks) {
      (_win as any).markdown.enable([RULE_NAME], true)
    } else {
      (_win as any).markdown.disable([RULE_NAME], true)
    }

    const transformer: Transformer = (_win as any).transformer
    const { root } = transformer.transform(content)

    const mm: Markmap = (_win as any).mm
    if (mm) {
      mm.setData(root)
    } else {
      const opts = {
        duration: 200,
      }

      const mm: Markmap = (_win as any).markmap.Markmap.create('#markmap', opts, root)

      const toolbar = (_win as any).markmap.Toolbar.create(mm).el
      toolbar.style.position = 'fixed'
      toolbar.style.top = '6px'
      toolbar.style.left = '6px'
      toolbar.style.zIndex = '100'
      _win.document.body.append(toolbar)

      toolbar.querySelector('.mm-toolbar-brand').setAttribute('target', '_blank')

      ;(_win as any).mm = mm
    }
  }
}

const renderDebounce = ctx.lib.lodash.debounce(render, 800)

function init () {
  logger.debug('init')
  src.value = ''

  ctx.lib.vue.nextTick(() => {
    const html = buildHTML()
    src.value = ctx.embed.buildSrc(html, 'Markmap')
  })
}

async function prepareExport (fun: (el: SVGSVGElement) => Promise<void>) {
  const win = iframe.value?.contentWindow
  if (win) {
    const mm: Markmap = (win as any).mm
    const d3 = (win as any).d3

    const p = d3.zoomIdentity.scale(1)
    await mm.svg.transition().duration(0).call(mm.zoom.transform, p).end().catch(() => 0)

    const svgNode = mm.svg.node() as SVGSVGElement
    const style = svgNode.getAttribute('style') || ''

    const { x, y, width, height } = svgNode.getBBox()
    svgNode.setAttribute('width', `${width}`)
    svgNode.setAttribute('height', `${height + 10}`)
    svgNode.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
    svgNode.removeAttribute('style')

    await fun(svgNode)

    svgNode.removeAttribute('width')
    svgNode.removeAttribute('height')
    svgNode.removeAttribute('viewBox')
    svgNode.setAttribute('style', style)

    const duration = mm.options.duration
    mm.options.duration = 0
    await (win as any).mm.fit()
    mm.options.duration = duration
  }
}

async function getSvg (): Promise<string> {
  return new Promise((resolve, reject) => {
    prepareExport(async el => {
      const svg = el.outerHTML
        .replace(/ id="markmap"/, '')
        .replace(/<\/(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)>/g, '')
        .replace(/<(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)([^>]*)>/g, '<$1$2/>')
      resolve(svg)
    }).catch(reject)
  })
}

async function downloadSvg () {
  const svg = await getSvg()
  ctx.utils.downloadContent('markmap.svg', svg, 'image/svg+xml')
}

async function downloadPng () {
  await prepareExport(async el => {
    el.style.width = (Number(el.getAttribute('width')!) * 2) + 'px'
    el.style.height = (Number(el.getAttribute('height')!) * 2) + 'px'

    const dataUrl = await ctx.lib.domtoimage.toPng(el, { bgcolor: '#fff' })
    ctx.utils.downloadDataURL('markmap.png', dataUrl)
  })
}

async function beforeExport () {
  if (!props.fence) {
    return
  }

  const svg = await getSvg()
  img.value = 'data:image/svg+xml;base64,' + ctx.utils.strToBase64(svg)
}

async function afterExport () {
  img.value = ''
}

async function onLoad (win?: Window) {
  logger.debug('onLoad')
  const _win = win || iframe.value?.contentWindow
  if (_win) {
    const markmap = (_win as any).markmap
    const { loadCSS, loadJS } = markmap
    const transformer: Transformer = new markmap.Transformer([
      ...markmap.builtInPlugins,
      {
        name: 'convert-link',
        transform (hooks: ITransformHooks) {
          hooks.parser.tap((md: MarkdownIt) => {
            ((_win as any).markdown) = md
            md.core.ruler.push('convert-relative-path', (state) => {
              state.env = {
                ...state.env,
                file: {
                  name: props.file?.name,
                  repo: props.file?.repo,
                  path: props.file?.path,
                }
              }
              linkApi.mdRuleConvertLink(state)
            })
            md.inline.ruler.after('link', RULE_NAME, wikiLinksApi.mdRuleWikiLinks)
            md.validateLink = () => true
          })
        }
      }
    ])

    ;(_win as any).transformer = transformer

    transformer.hooks.retransform.tap(() => {
      logger.debug('retransform')
      render(_win)
    })

    const { styles, scripts } = transformer.getAssets()
    if (styles) {
      loadCSS(styles)
    }

    if (scripts) {
      loadJS(scripts, { getMarkmap: () => markmap })
    }

    render(_win)

    _win.addEventListener('click', e => {
      const target = e.target as HTMLAnchorElement
      if (target.tagName === 'A') {
        if (linkApi.htmlHandleLink(target)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }, true)
  }
}

function changedSetting (payload: { changedKeys: string[] }) {
  if (payload.changedKeys.includes('render.md-wiki-links')) {
    render()
  }
}

const onIframeLoad = () => onLoad()

ctx.lib.vue.watch(() => props.source, () => {
  renderDebounce()
})

ctx.lib.vue.onMounted(() => {
  init()
  ctx.registerHook('EXPORT_BEFORE_PREPARE', beforeExport)
  ctx.registerHook('EXPORT_AFTER_PREPARE', afterExport)
  ctx.registerHook('SETTING_CHANGED', changedSetting)
})

ctx.lib.vue.onBeforeUnmount(() => {
  ctx.removeHook('EXPORT_BEFORE_PREPARE', beforeExport)
  ctx.removeHook('EXPORT_AFTER_PREPARE', afterExport)
  ctx.removeHook('SETTING_CHANGED', changedSetting)
})
</script>

<style>
.markmap-preview {
  transform: translateX(0);
  background: #fff;
  height: 300px;
  width: 100%;
  margin-bottom: 16px;
}

.markmap-preview.hidden {
  display: none;
}

.markmap-preview-action {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100;
  padding: 6px;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 0.2s;
}

.markmap-preview:hover > .markmap-preview-action {
  opacity: 1;
}
</style>
