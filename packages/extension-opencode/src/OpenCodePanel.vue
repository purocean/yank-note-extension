<template>
  <div
    v-show="visible"
    class="fixed-float"
    v-auto-z-index="{ layer: 'popup' }"
    @click.stop
    :style="{
      top: ctx.env.isElectron ? '66px' : '36px',
      right: '20px',
    }"
  >
    <div class="close-btn" @click="handleClose" :title="i18n.t('close')">
      <svg-icon name="times" width="14px" height="14px" />
    </div>
    <div :class="{ wrapper: true, expanded }">
      <div class="container-wrapper">
        <div class="title" @dblclick="expanded = !expanded">{{ i18n.t('opencode-panel') }}</div>
        <div v-if="terminalReady" class="action-btn" @click="stopTerminal" :title="i18n.t('stop-opencode')">
          <svg-icon name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/></svg>' width="10px" height="10px" />
        </div>
        <div v-if="terminalReady" class="action-btn" @click="openInBrowser" :title="i18n.t('open-in-browser')" style="left: 26px;">
          <svg-icon name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M352 0c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9L370.7 96 201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L416 141.3l41.4 41.4c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V32c0-17.7-14.3-32-32-32H352zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/></svg>' width="9px" height="9px" />
        </div>
        <div v-if="terminalReady && !isSameRepo" class="restart-btn" @click="restartTerminal" :title="i18n.t('restart-opencode')">
          <span class="restart-hint">{{ i18n.t('repo-mismatch') }}</span>
        </div>
        <div v-if="terminalReady && isSameRepo && currentFileName" class="context-btn" @click="addContext" :title="i18n.t('add-context')">
          <span class="context-info">{{ displayFileName }}<template v-if="selectionLines">#{{ selectionLines }}</template></span>
          <svg-icon name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>' width="10px" height="10px" />
        </div>
        <div class="action-btn" @click="expanded = !expanded" :title="expanded ? 'Collapse' : 'Expand'" style="right: 23px; left: unset; padding: 5px;">
          <svg-icon v-if="expanded" name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M200 288H88c-21.4 0-32.1 25.8-17 41l32.9 31-99.2 99.3c-6.2 6.2-6.2 16.4 0 22.6l25.4 25.4c6.2 6.2 16.4 6.2 22.6 0L152 408l31.1 33c15.1 15.1 40.9 4.4 40.9-17V312c0-13.3-10.7-24-24-24zm112-64h112c21.4 0 32.1-25.9 17-41l-33-31 99.3-99.3c6.2-6.2 6.2-16.4 0-22.6L481.9 4.7c-6.2-6.2-16.4-6.2-22.6 0L360 104l-31.1-33C313.8 55.9 288 66.6 288 88v112c0 13.3 10.7 24 24 24zm96 136l33-31.1c15.1-15.1 4.4-40.9-17-40.9H312c-13.3 0-24 10.7-24 24v112c0 21.4 25.9 32.1 41 17l31-32.9 99.3 99.3c6.2 6.2 16.4 6.2 22.6 0l25.4-25.4c6.2-6.2 6.2-16.4 0-22.6L408 360zM183 71.1L152 104 52.7 4.7c-6.2-6.2-16.4-6.2-22.6 0L4.7 30.1c-6.2 6.2-6.2 16.4 0 22.6L104 152l-33 31.1C55.9 198.2 66.6 224 88 224h112c13.3 0 24-10.7 24-24V88c0-21.3-25.9-32-41-16.9z"/></svg>' width="10px" height="10px" />
          <svg-icon v-else name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M448 344v112a23.9 23.9 0 0 1 -24 24H312c-21.4 0-32.1-25.9-17-41l36.2-36.2L224 295.6 116.8 402.9 153 439c15.1 15.1 4.4 41-17 41H24a23.9 23.9 0 0 1 -24-24V344c0-21.4 25.9-32.1 41-17l36.2 36.2L184.5 256 77.2 148.7 41 185c-15.1 15.1-41 4.4-41-17V56a23.9 23.9 0 0 1 24-24h112c21.4 0 32.1 25.9 17 41l-36.2 36.2L224 216.4l107.2-107.3L295 73c-15.1-15.1-4.4-41 17-41h112a23.9 23.9 0 0 1 24 24v112c0 21.4-25.9 32.1-41 17l-36.2-36.2L263.5 256l107.3 107.3L407 327.1c15.1-15.2 41-4.5 41 16.9z"/></svg>' width="10px" height="10px" />
        </div>
        <div class="container">
          <div v-if="!terminalReady" class="content">
            <div class="logo">
              <img :src="logoSvg" alt="OpenCode Logo" />
            </div>
            <h2 class="name">OpenCode</h2>
            <p class="description">{{ i18n.t('opencode-description') }}</p>
            <div class="actions">
              <button class="btn primary" @click="initTerminal">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" width="16" height="16">
                  <path d="M9.4 86.6C-3.1 74.1-3.1 53.9 9.4 41.4s32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L178.7 256 9.4 86.6zM256 416H544c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/>
                </svg>
                {{ i18n.t('start-opencode') }}
                <span class="btn-tooltip">{{ i18n.t('backup-warning') }}</span>
              </button>
              <button class="btn secondary" @click="visitDocs">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="16" height="16">
                  <path d="M352 0c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9L370.7 96 201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L416 141.3l41.4 41.4c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V32c0-17.7-14.3-32-32-32H352zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/>
                </svg>
                {{ i18n.t('visit-docs') }}
              </button>
            </div>
            <div class="proxy-config">
              <label class="proxy-label" for="proxy-input">{{ i18n.t('proxy-label') }}</label>
              <input
                id="proxy-input"
                v-model="proxyUrl"
                type="text"
                :placeholder="i18n.t('proxy-placeholder')"
              />
            </div>
          </div>
          <div v-else class="xterm-container">
            <x-term ref="refXterm" @fit="onFit" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ctx } from '@yank-note/runtime-api'
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, watchEffect, type Ref, shallowRef } from 'vue'
import { createOpencodeClient, OpencodeClient } from '@opencode-ai/sdk/client'
import logoSvg from './assets/icon.svg'
import { i18n, proxyStorageKey } from './lib'
import { Components } from '@yank-note/runtime-api/types/types/renderer/types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { SvgIcon, XTerm } = ctx.components
const logger = ctx.utils.getLogger('OpenCodePanel')

// eslint-disable-next-line no-undef
const props = defineProps<{
  visible: Ref<boolean>
}>()

// eslint-disable-next-line no-undef, func-call-spacing
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:running', value: boolean): void
}>()

const visible = computed(() => props.visible.value)

function handleClose () {
  emit('update:visible', false)
}

const editor = ctx.editor.getEditor()

const expanded = ref(false)
const terminalReady = ref(false)
const refXterm = ref<Components.XTerm.Ref | null>(null)
const currentFileName = ref('')
const selectionLines = ref('')
const currentRepo = shallowRef(ctx.store.state.currentRepo)
const proxyUrl = ref(ctx.storage.get(proxyStorageKey, ''))

let opencodeClient: OpencodeClient | null = null
let opencodePort: number | null = null

const isSameRepo = computed(() => {
  return ctx.store.state.currentRepo?.path === currentRepo.value?.path
})

const displayFileName = computed(() => {
  const name = currentFileName.value
  if (name.length > 20) {
    return name.slice(0, 8) + '...' + name.slice(-9)
  }
  return name
})

function updateEditorInfo () {
  const currentFile = ctx.store.state.currentFile
  if (currentFile && currentFile.plain && currentRepo.value?.name === currentFile.repo) {
    currentFileName.value = currentFile.name
  } else {
    currentFileName.value = ''
  }

  const selection = editor.getSelection()
  if (selection && !selection.isEmpty()) {
    const startLine = selection.startLineNumber
    const endLine = selection.endLineNumber
    selectionLines.value = startLine === endLine
      ? `${startLine}`
      : `${startLine}-${endLine}`
  } else {
    selectionLines.value = ''
  }
}

async function addContext () {
  const currentFile = ctx.store.state.currentFile
  if (!currentFile) return

  // Use SDK API to add context if client is available
  if (opencodeClient) {
    try {
      const path = currentFile.path.replace(/^\//, '')
      const text = `In ${path}${selectionLines.value ? `#L${selectionLines.value}` : ''}\n`

      await opencodeClient.tui.appendPrompt({
        body: { text },
      })

      input('\n') // Add a new line after adding context
      focus()
    } catch (err) {
      console.error('Failed to add context via SDK:', err)
      ctx.ui.useToast().show('warning', 'Failed to add context')
    }
  } else {
    ctx.ui.useToast().show('warning', 'Opencode client not ready')
  }
}

function focus () {
  refXterm.value?.getXterm()?.focus()
}

function fitXterm () {
  refXterm.value?.fit()
}

function input (data: string, addNewLine = false) {
  refXterm.value?.input(data, addNewLine)
}

async function initTerminal () {
  terminalReady.value = true
  emit('update:running', true)

  await nextTick()

  if (!refXterm.value) return

  currentRepo.value = ctx.store.state.currentRepo
  const workDir = currentRepo.value?.path || ''
  const env: Record<string, string> = {}

  if (proxyUrl.value.trim()) {
    env.https_proxy = proxyUrl.value.trim()
  }

  refXterm.value.init({
    cwd: workDir,
    fontSize: 13,
    env,
    onDisconnect () {
      cleanup()
    },
  })

  await ctx.utils.sleep(100)

  const xterm = refXterm.value.getXterm()

  // Handle focus/blur for shortcuts
  xterm.textarea?.addEventListener('focus', () => {
    ctx.keybinding.disableShortcuts()
  })

  xterm.textarea?.addEventListener('blur', () => {
    ctx.keybinding.enableShortcuts()
  })

  // Generate random port for opencode server
  opencodePort = 40000 + Math.floor(Math.random() * 10000)

  fitXterm()
  updateEditorInfo()

  // Build opencode command with optional proxy
  const command = `opencode --port ${opencodePort}`
  input(command, true)

  // Wait for opencode to start and create client
  await new Promise(resolve => setTimeout(resolve, 2000))

  try {
    opencodeClient = createOpencodeClient({
      baseUrl: `http://127.0.0.1:${opencodePort}`,
      throwOnError: true,
    })

    const events = await opencodeClient.event.subscribe({
      throwOnError: true,
      onSseError (error) {
        logger.error('Opencode SSE error:', error)
        if (String(error).includes('network error')) {
          cleanup()
        }
      }
    })

    for await (const event of events.stream) {
      logger.debug('Received opencode event:', event.type)
      if (event.type === 'server.connected') {
        logger.info('Opencode server connected')
        // Ensure terminal fits after server connection
        fitXterm()
      } if (event.type === 'server.instance.disposed') {
        logger.info('Opencode server disposed')
        cleanup()
      } else if (event.type === 'file.edited') {
        // Refresh tree if no index status
        if (!ctx.store.state.currentRepoIndexStatus) {
          logger.info('File edited event received, refreshing tree')
          ctx.tree.refreshTree()
        }
      }
    }
  } catch (err) {
    cleanup()
    console.error('Failed to create opencode client:', err)
  }
}

function cleanup () {
  opencodeClient = null
  opencodePort = null
  ctx.keybinding.enableShortcuts()
  refXterm.value?.dispose()
  terminalReady.value = false
  emit('update:running', false)
}

async function stopTerminal () {
  const res = await ctx.ui.useModal().confirm({
    title: i18n.t('stop-opencode'),
    content: i18n.t('stop-opencode-confirm'),
  })

  if (res) {
    cleanup()
  }
}

async function restartTerminal () {
  const res = await ctx.ui.useModal().confirm({
    title: i18n.t('restart-opencode'),
    content: i18n.t('restart-opencode-confirm'),
  })

  if (res) {
    cleanup()
    await nextTick()
    initTerminal()
  }
}

function visitDocs () {
  window.open('https://opencode.ai/docs/', '_blank')
}

function openInBrowser () {
  if (opencodePort) {
    ctx.env.openWindow(`http://127.0.0.1:${opencodePort}`, '_blank')
  }
}

function onFit () {
  const element = refXterm.value?.getXterm()?.element as HTMLElement
  if (!element) return

  const width = element?.offsetWidth || 0
  const xtermScreen = element?.querySelector('.xterm-screen') as HTMLElement
  const xtermScreenWidth = xtermScreen?.offsetWidth || 0
  const paddingLeft = Math.max(0, (width - xtermScreenWidth) / 2) + 1
  xtermScreen.style.marginLeft = paddingLeft + 'px'
}

let editorDisposables: { dispose: () => void }[] = []

onMounted(() => {
  updateEditorInfo()
  editorDisposables = [
    editor.onDidChangeCursorSelection(updateEditorInfo),
  ]
})

onBeforeUnmount(() => {
  cleanup()
  editorDisposables.forEach(d => d.dispose())
  editorDisposables = []
})

watch(() => [ctx.store.state.currentFile, ctx.store.state.currentRepo], updateEditorInfo)

watchEffect(() => {
  if (props.visible.value && terminalReady.value) {
    nextTick(() => {
      fitXterm()
      focus()
    })
  }
})

watchEffect(() => {
  ctx.storage.set(proxyStorageKey, proxyUrl.value)
})
</script>

<style lang="scss" scoped>
.fixed-float {
  position: fixed;
  padding: 1px;
  margin: 0;
  background: var(--g-color-backdrop);
  border: 1px var(--g-color-84) solid;
  border-left: 0;
  border-top: 0;
  color: var(--g-foreground-color);
  min-width: 50px;
  cursor: default;
  box-shadow: rgba(0, 0, 0, 0.3) 2px 2px 10px;
  border-radius: var(--g-border-radius);
  overflow: hidden;
  backdrop-filter: var(--g-backdrop-filter);

  .close-btn {
    position: absolute;
    right: 3px;
    top: 3px;
    width: 20px;
    height: 20px;
    padding: 3px;
    box-sizing: border-box;
    color: var(--g-color-30);
    z-index: 10;

    &:hover {
      color: var(--g-color-0);
      background-color: var(--g-color-80);
      border-radius: 50%;
    }

    .svg-icon {
      display: block;
    }
  }
}

.wrapper {
  width: 38vw;
  max-width: 38vw;

  &.expanded {
    width: calc(100vw - 40px);
    max-width: 100vw;

    .container-wrapper {
      max-height: 100vh;
    }
  }
}

.container-wrapper {
  width: 100%;
  height: calc(100vh - 100px);
  max-height: calc(100vh - 100px);
  position: relative;

  .container {
    width: 100%;
    height: 100%;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
  }

  .action-btn {
    position: absolute;
    left: 3px;
    top: 2px;
    width: 20px;
    height: 20px;
    padding: 4px;
    box-sizing: border-box;
    color: var(--g-color-30);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: var(--g-color-0);
      background-color: var(--g-color-80);
      border-radius: 50%;
    }

    .svg-icon {
      display: block;
    }
  }

  .restart-btn,
  .context-btn {
    position: absolute;
    left: 49px;
    top: 2px;
    height: 16px;
    margin-top: 2px;
    padding: 0px 6px;
    box-sizing: border-box;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    cursor: pointer;
    border-radius: 10px;

    &:hover {
      background-color: var(--g-color-80);
    }

    .svg-icon {
      flex-shrink: 0;
    }
  }

  .restart-btn {
    color: rgba(230, 126, 34, 0.85);
    max-width: 220px;

    .restart-hint {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .context-btn {
    color: var(--g-color-30);
    max-width: 180px;

    &:hover {
      color: var(--g-color-0);
    }

    .context-info {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.title {
  position: absolute;
  top: 0;
  left: 0;
  height: 24px;
  line-height: 24px;
  text-align: center;
  padding: 0 60px;
  box-sizing: border-box;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  background: rgba(var(--g-color-90-rgb), 0.94);
  border-bottom: var(--g-color-85) 1px solid;
  z-index: 8;
  color: var(--g-color-10);
  font-size: 13px;
  user-select: none;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px 70px;
  text-align: center;

  .logo {
    color: var(--g-color-anchor);
    margin-bottom: 16px;

    img {
      width: 64px;
      height: 64px;
    }
  }

  .name {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--g-color-10);
  }

  .description {
    margin: 0 0 24px 0;
    font-size: 14px;
    color: var(--g-color-40);
    max-width: 300px;
  }

  .actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    .btn-tooltip {
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--g-color-20);
      color: var(--g-color-95);
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: normal;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 100;

      &::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-bottom-color: var(--g-color-20);
      }
    }

    &:hover .btn-tooltip {
      opacity: 1;
    }

    &.primary {
      background: var(--g-color-accent);
      color: #fff;

      &:hover {
        filter: brightness(1.1);
      }
    }

    &.secondary {
      background: var(--g-color-80);
      color: var(--g-color-10);

      &:hover {
        background: var(--g-color-75);
      }
    }
  }

  .proxy-config {
    display: flex;
    align-items: center;
    gap: 2px;
    position: absolute;
    right: 10px;
    bottom: 10px;

    .proxy-label {
      font-size: 12px;
      color: var(--g-color-30);
      white-space: nowrap;
    }

    input {
      font-size: 12px;
    }
  }
}

.xterm-container {
  width: 100%;
  height: calc(100% - 32px);
  margin-top: 30px;
  padding: 0;
  box-sizing: border-box;
  background: var(--g-color-98);
}
</style>
