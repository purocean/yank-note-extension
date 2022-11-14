<template>
  <div v-if="html" class="milkdown-editor-wrapper">
    <IFrame
      globalStyle
      triggerParentKeyBoardEvent
      :html="html"
      :iframeProps="{ width: '100%', height: '100%', border: 'none' }"
      :onLoad="onLoad"
    />
  </div>
</template>

<script lang="ts" setup>
import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'

const { ref, watchEffect } = ctx.lib.vue
const html = ref('')
const IFrame = ctx.embed.IFrame

const i18n = ctx.i18n.createI18n({
  'zh-CN': {
    tips: '实验性质扩展，使用有风险。',
    disable: '禁用',
  },
  en: {
    tips: 'Experimental extension, use at your own risk.',
    disable: 'Disable',
  },
})

function onLoad (iframe: HTMLIFrameElement) {
  const base = getExtensionBasePath(__EXTENSION_ID__)
  const document = iframe.contentDocument!

  const style = document.createElement('link')
  style.rel = 'stylesheet'
  style.href = `${base}/editor/style.css`
  document.head.appendChild(style)

  const script = document.createElement('script')
  script.src = `${base}/editor/index.js`
  document.body.appendChild(script)
}

watchEffect(() => {
  const file = ctx.store.state.currentFile
  if (file && ctx.doc.isMarkdownFile(file)) {
    html.value = `
      <style>
        html {
          background: var(--g-color-97);
          padding: 0;
        }

        body {
          max-width: 1024px;
          margin: 0 auto;
          background: var(--g-color-97);
        }

        body > .tips,
        body > .tips a {
          color: var(--g-color-40);
          font-size: 12px;
          text-align: center;
          padding: 6px;
        }

        .milkdown-menu {
          position: sticky;
          top: 0;
          z-index: 99999;
          margin: 0 -1px;
          box-sizing: content-box;
          width: 100%;
        }

        .milkdown-menu > button {
          height: 16px;
          width: 16px;
          padding: 7px;
          margin: 4px;
        }

        .milkdown-menu .menu-selector {
          height: 16px;
          padding: 7px;
          width: 80px;
          margin: 0;
        }

        .milkdown-menu .menu-selector-wrapper {
          height: 16px;
          padding: 0;
          margin: 4px;
        }

        .milkdown-menu .menu-selector-list {
          position: fixed;
          margin-top: 38px;
        }

        .milkdown-menu .divider {
          min-height: 10px;
          margin: 12px 0;
        }

        #editor {
          margin-bottom: 20px;
        }

        .milkdown .editor {
          padding: 50px 30px;
        }
      </style>
      <div class="tips">${i18n.t('tips')}<a href="javascript:ctx.showExtensionManager('${__EXTENSION_ID__}')">${i18n.t('disable')}</a></div>
      <div id="editor"></div>
    `
  } else {
    html.value = ''
  }
})
</script>

<style scoped>
.milkdown-editor-wrapper {
  height: 100%;
  width: 100%;
}
</style>
