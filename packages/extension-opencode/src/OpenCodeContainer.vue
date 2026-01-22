<template>
  <div class="opencode-container">
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
</template>

<script setup lang="ts">
import { ctx } from '@yank-note/runtime-api'
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, watchEffect, shallowRef } from 'vue'
import { createOpencodeClient, OpencodeClient } from '@opencode-ai/sdk/client'
import logoSvg from './assets/icon.svg'
import { i18n, proxyStorageKey } from './lib'
import { Components } from '@yank-note/runtime-api/types/types/renderer/types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { XTerm } = ctx.components
const logger = ctx.utils.getLogger('OpenCodeContainer')

export interface ActionButton {
  key: 'stop' | 'open-browser' | 'restart' | 'add-context'
  label: string
  title: string
  disabled?: boolean
  handler: () => void | Promise<void>
  meta?: {
    fileName?: string
    displayFileName?: string
    selectionLines?: string
    hint?: string
  }
}

export interface UpdatePayload {
  terminalReady: boolean
  actions: ActionButton[]
}

// eslint-disable-next-line no-undef
const props = defineProps<{
  visible: boolean
}>()

// eslint-disable-next-line no-undef, func-call-spacing
const emit = defineEmits<{
  (e: 'update', payload: UpdatePayload): void
  (e: 'update:running', value: boolean): void
}>()

const editor = ctx.editor.getEditor()

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
  emitUpdate()

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
  emitUpdate()
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

function buildActions (): ActionButton[] {
  const actions: ActionButton[] = []

  if (!terminalReady.value) {
    return actions
  }

  // Stop button
  actions.push({
    key: 'stop',
    label: i18n.t('stop-opencode'),
    title: i18n.t('stop-opencode'),
    handler: stopTerminal,
  })

  // Open in browser button
  actions.push({
    key: 'open-browser',
    label: i18n.t('open-in-browser'),
    title: i18n.t('open-in-browser'),
    handler: openInBrowser,
  })

  // Restart button (when repo mismatch)
  if (!isSameRepo.value) {
    actions.push({
      key: 'restart',
      label: i18n.t('restart-opencode'),
      title: i18n.t('restart-opencode'),
      handler: restartTerminal,
      meta: {
        hint: i18n.t('repo-mismatch'),
      },
    })
  }

  // Add context button
  if (isSameRepo.value && currentFileName.value) {
    actions.push({
      key: 'add-context',
      label: i18n.t('add-context'),
      title: i18n.t('add-context'),
      handler: addContext,
      meta: {
        fileName: currentFileName.value,
        displayFileName: displayFileName.value,
        selectionLines: selectionLines.value,
      },
    })
  }

  return actions
}

function emitUpdate () {
  emit('update', {
    terminalReady: terminalReady.value,
    actions: buildActions(),
  })
}

let editorDisposables: { dispose: () => void }[] = []

onMounted(() => {
  updateEditorInfo()
  editorDisposables = [
    editor.onDidChangeCursorSelection(updateEditorInfo),
  ]
  emitUpdate()
})

onBeforeUnmount(() => {
  cleanup()
  editorDisposables.forEach(d => d.dispose())
  editorDisposables = []
})

watch(() => [ctx.store.state.currentFile, ctx.store.state.currentRepo], () => {
  updateEditorInfo()
  emitUpdate()
})

watch([terminalReady, isSameRepo, currentFileName, selectionLines], () => {
  emitUpdate()
})

watchEffect(() => {
  if (props.visible && terminalReady.value) {
    nextTick(() => {
      fitXterm()
      focus()
    })
  }
})

watchEffect(() => {
  ctx.storage.set(proxyStorageKey, proxyUrl.value)
})

// Expose methods for parent component
defineExpose({
  focus,
  fitXterm,
})
</script>

<style lang="scss" scoped>
.opencode-container {
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
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
