<template>
  <component :is="fence ? 'div' : Fragment" class="markmap-preview">
    <div class="markmap-preview-action">
      <button class="btn small" @click="downloadSvg">SVG</button>
      <button class="btn small" @click="downloadPng">PNG</button>
      <button class="btn small" @click="init">{{_$t('reload')}}</button>
      <button class="btn small" @click="newWindow">{{_$t('open-in-new-window')}}</button>
    </div>
    <iframe v-if="src" ref="iframe" @load="onLoad()" :src="src" frameborder="0" width="100%" height="100%"></iframe>
  </component>
</template>

<script lang="ts" setup>
import { ctx } from '@yank-note/runtime-api'
import type { Markmap } from 'markmap-view'
import type { Transformer } from 'markmap-lib'
import { buildHTML, handleLink, transformLink } from './helper'

const logger = ctx.utils.getLogger('markmap-previewer')
const Fragment = ctx.lib.vue.defineComponent({
  setup (_, { slots }) {
    return () => slots.default?.()
  }
})

const src = ctx.lib.vue.ref('')
const iframe = ctx.lib.vue.ref<HTMLIFrameElement>()
const { $t: _$t } = ctx.i18n.useI18n()

// eslint-disable-next-line no-undef
const props = defineProps({
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

      mm.viewHooks.transformHtml.tap((_, nodes) => {
        transformLink(nodes)
      })

      const toolbar = (_win as any).markmap.Toolbar.create(mm)
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

async function prepareExport (fun: (el: HTMLElement) => Promise<void>, radio = 1) {
  const win = iframe.value?.contentWindow
  if (win) {
    const g = win.document.querySelector('#markmap > g')!
    const { width, height } = g.getBoundingClientRect()
    const el = win.document.getElementById('markmap')!
    el.style.minWidth = `${width * radio}px`
    el.style.minHeight = `${height * radio}px`
    el.style.maxWidth = `${width * radio}px`
    el.style.maxHeight = `${height * radio}px`
    await (win as any).mm.fit()

    await fun(el)

    el.style.minHeight = ''
    el.style.minWidth = ''
    el.style.maxHeight = ''
    el.style.maxWidth = ''

    await (win as any).mm.fit()
  }
}

async function downloadSvg () {
  await prepareExport(async el => {
    const svg = el.outerHTML
      .replace(/ id="markmap"[^>]*>/, '>')
      .replace(/<br>/g, '<br/>')
    ctx.utils.downloadContent('markmap.svg', svg)
  })
}

async function downloadPng () {
  await prepareExport(async el => {
    const dataUrl = await ctx.lib.domtoimage.toPng(el, { bgcolor: '#fff' })
    ctx.utils.downloadDataURL('markmap.png', dataUrl)
  }, 4)
}

async function onLoad (win?: Window) {
  logger.debug('onLoad')
  const _win = win || iframe.value?.contentWindow
  if (_win) {
    const markmap = (_win as any).markmap
    const { loadCSS, loadJS } = markmap
    const transformer: Transformer = new markmap.Transformer()

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

    _win.document.addEventListener('click', e => {
      const target = e.target as HTMLAnchorElement
      if (target.tagName === 'A') {
        handleLink(e)
      }
    }, true)
  }
}

ctx.lib.vue.watch(() => props.source, () => {
  renderDebounce()
})

ctx.lib.vue.onMounted(init)
</script>

<style>
.markmap-preview {
  transform: translateX(0);
  background: #fff;
  height: 300px;
  width: 100%;
  margin-bottom: 16px;
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
