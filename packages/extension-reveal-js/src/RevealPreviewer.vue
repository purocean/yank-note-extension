<template>
  <div class="reveal-js-preview-wrapper">
    <div v-if="src" class="reveal-js-preview">
      <div class="reveal-js-preview-action">
        <button class="btn small" @click="init">{{_$t('reload')}}</button>
        <button class="btn small" @click="fullscreen">{{$t('fullscreen')}}</button>
        <button class="btn small" @click="present(true)">{{_$t('print')}}</button>
        <button class="btn small" @click="present(false)">{{_$t('open-in-new-window')}}</button>
      </div>
      <iframe ref="iframe" @load="onLoad" :src="src" frameborder="0" width="100%" height="100%"></iframe>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ctx } from '@yank-note/runtime-api'
import { buildHTML, processReveal, getContentHtml, getOpts, present, i18n } from './helper'

const logger = ctx.utils.getLogger('reveal-previewer')

const src = ctx.lib.vue.ref('')
const iframe = ctx.lib.vue.ref<HTMLIFrameElement>()
const { $t: _$t } = ctx.i18n.useI18n()
const { $t } = i18n

function fullscreen () {
  const contentDocument = iframe.value?.contentDocument
  if (contentDocument) {
    const documentElement: any = contentDocument.documentElement
    // Check which implementation is available
    const requestMethod = documentElement.requestFullscreen ||
              documentElement.webkitRequestFullscreen ||
              documentElement.webkitRequestFullScreen ||
              documentElement.mozRequestFullScreen ||
              documentElement.msRequestFullscreen

    if (requestMethod) {
      requestMethod.apply(documentElement)
    }
  }
}

function _processReveal (init: boolean) {
  if (iframe.value) {
    const opts = getOpts()
    const win = iframe.value.contentWindow!
    processReveal(win, opts, getContentHtml(), init)
  }
}

function render () {
  logger.debug('render')
  _processReveal(false)
}

const renderDebounce = ctx.lib.lodash.debounce(render, 1000)

function init () {
  logger.debug('init')
  src.value = ''

  ctx.lib.vue.nextTick(() => {
    const opts = getOpts()
    const theme = opts.theme || 'black'

    const html = buildHTML(theme, false)
    src.value = ctx.embed.buildSrc(html, 'Reveal.js')
  })
}

async function onLoad () {
  logger.debug('onLoad')
  _processReveal(true)
}

ctx.registerHook('VIEW_RENDERED', renderDebounce)
ctx.registerHook('VIEW_FILE_CHANGE', init)

ctx.lib.vue.onMounted(init)

ctx.lib.vue.onBeforeUnmount(() => {
  logger.debug('clean')
  ctx.removeHook('VIEW_RENDERED', renderDebounce)
  ctx.removeHook('VIEW_FILE_CHANGE', init)
})
</script>

<style>
.reveal-js-preview-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
}

.reveal-js-preview {
  position: relative;
  width: 100%;
  height: 0%;
  padding-top: 65%;
}

.reveal-js-preview-action {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px;
  box-sizing: border-box;
  width: 100%;
  text-align: right;
  opacity: 0;
  transition: opacity 0.2s;
}

.reveal-js-preview:hover .reveal-js-preview-action {
  opacity: 1;
}

iframe {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
