<template>
  <div class="nes-emulator">
    <div class="action" v-if="url">
      <div class="x-btn" @click="saveState">Save State</div>
      <div class="x-btn" @click="loadState">Load State</div>
      <div class="x-btn" @click="resetState">Reset</div>
    </div>
    <iframe ref="iframeRef" v-if="url" :src="url" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect, nextTick } from 'vue'
import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'
import { Doc } from '@yank-note/runtime-api/types/types/share/types'

const url = ref('')
const iframeRef = ref<HTMLIFrameElement | null>(null)

watchEffect(() => {
  const currentFile = ctx.store.state.currentFile

  url.value = ''
  nextTick(() => {
    if (currentFile && currentFile.name.toLowerCase().endsWith('.nes')) {
      url.value = getExtensionBasePath(__EXTENSION_ID__) + '/emulator/index.html#/run/' + encodeURIComponent(ctx.base.getAttachmentURL(currentFile))
    }

    focusIframe()
  })
})

function focusIframe () {
  nextTick(() => {
    const iframe: HTMLIFrameElement | null = document.querySelector('.nes-emulator > iframe')
    if (iframe) {
      iframe.focus()
    }
  })
}

async function saveState() {
  const currentFile = ctx.store.state.currentFile

  if (!currentFile || !iframeRef.value) {
    return
  }

  ctx.ui.useToast().show('info', 'Saving state...')

  try {
    const filePath = currentFile.path + '.state'
    const win: any = iframeRef.value.contentWindow

    const state = win.nes.toJSON()
    const content = ctx.utils.strToBase64(JSON.stringify(state))
    await ctx.api.upload(currentFile.repo, content, filePath)
    ctx.tree.refreshTree()
    ctx.ui.useToast().show('info', 'State saved')
  } catch (error) {
    console.error(error)
    ctx.ui.useToast().show('warning', 'Failed to save state')
  } finally {
    focusIframe()
  }
}

async function loadState() {
  const currentFile = ctx.store.state.currentFile

  if (!currentFile || !iframeRef.value) {
    return
  }

  if (!(await ctx.ui.useModal().confirm({
    title: 'Load State',
    content: 'Are you sure you want to load the recorded state? This will overwrite the current state.',
  }))) {
    return
  }

  ctx.ui.useToast().show('info', 'Loading state...')

  try {
    const filePath = currentFile.path + '.state'
    const stateFile: Doc = { type: 'file', name: filePath + '.state', repo: currentFile.repo, path: filePath}
    const content = await fetch(ctx.base.getAttachmentURL(stateFile)).then(res => res.text())
    const state = JSON.parse(content)
    const win: any = iframeRef.value.contentWindow

    win.nes.fromJSON(state)
    ctx.ui.useToast().show('info', 'State loaded')
  } catch (error) {
    console.error(error)
    ctx.ui.useToast().show('warning', 'Failed to load state')
  } finally {
    focusIframe()
  }
}

async function resetState() {
  const currentFile = ctx.store.state.currentFile

  if (!currentFile || !iframeRef.value) {
    return
  }

  if (await ctx.ui.useModal().confirm({
    title: 'Reset State',
    content: 'Are you sure you want to reset the state?',
  })) {
    const win: any = iframeRef.value.contentWindow
    win.location.reload()
  }

  focusIframe()
}
</script>

<style scoped>
.nes-emulator {
  height: 100%;
  width: 100%;
  border-top: 1px var(--g-color-70) solid;
  position: relative;
}

.nes-emulator > iframe {
  height: 100%;
  width: 100%;
  border: none;
}

.action {
  position: absolute;
  top: 0;
  left: 16px;
}

.action .x-btn {
  display: inline-block;
  font-weight: 400;
  text-align: center;
  vertical-align: middle;
  user-select: none;
  background-color: initial;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0;
  color: #fff;
  border-color: #fff;
  cursor: pointer;
  margin-top: 8px;
  margin-right: 16px;
}

.action .x-btn:hover {
  color: #000;
  background-color: #fff;
  border-color: #fff;
}
</style>
