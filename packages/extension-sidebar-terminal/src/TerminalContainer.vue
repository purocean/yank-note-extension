<template>
  <div class="terminal-container">
    <div v-if="!terminalReady" class="content">
      <div class="logo">
        <img :src="logoSvg" alt="Sidebar Terminal Logo" />
      </div>
      <h2 class="name">Sidebar Terminal</h2>
      <p class="description">{{ i18n.t('terminal-description') }}</p>
      <div class="actions">
        <button class="btn primary" @click="initTerminal()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="16" height="16">
            <path d="M73.4 182.6C60.9 170.1 60.9 149.8 73.4 137.3C85.9 124.8 106.2 124.8 118.7 137.3L278.7 297.3C291.2 309.8 291.2 330.1 278.7 342.6L118.7 502.6C106.2 515.1 85.9 515.1 73.4 502.6C60.9 490.1 60.9 469.8 73.4 457.3L210.7 320L73.4 182.6zM288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"/>
          </svg>
          {{ i18n.t('start-terminal') }}
        </button>
        <div
          v-for="(command, index) in customCommands"
          :key="command.id"
          class="command-item"
          @mouseenter="handleCommandMouseEnter(command.id)"
          @mouseleave="handleCommandMouseLeave(command.id)"
        >
          <button
            class="btn command-btn"
            :style="getCommandStyle(index)"
            @click="initTerminal(command.command)"
            :title="command.command"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="16" height="16">
              <path d="M73.4 182.6C60.9 170.1 60.9 149.8 73.4 137.3C85.9 124.8 106.2 124.8 118.7 137.3L278.7 297.3C291.2 309.8 291.2 330.1 278.7 342.6L118.7 502.6C106.2 515.1 85.9 515.1 73.4 502.6C60.9 490.1 60.9 469.8 73.4 457.3L210.7 320L73.4 182.6zM288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"/>
            </svg>
            <span class="btn-text">{{ command.command }}</span>
          </button>
          <button
            v-if="deleteVisibleId === command.id"
            class="remove-btn"
            :title="i18n.t('custom-command-remove')"
            @click.stop="removeCustomCommand(command.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" width="10" height="10">
              <path d="M55.1 73.4C67.6 60.9 87.9 60.9 100.4 73.4L192 164.9 283.6 73.4C296.1 60.9 316.4 60.9 328.9 73.4C341.4 85.9 341.4 106.2 328.9 118.7L237.3 210.3 328.9 301.9C341.4 314.4 341.4 334.7 328.9 347.2C316.4 359.7 296.1 359.7 283.6 347.2L192 255.6 100.4 347.2C87.9 359.7 67.6 359.7 55.1 347.2C42.6 334.7 42.6 314.4 55.1 301.9L146.7 210.3 55.1 118.7C42.6 106.2 42.6 85.9 55.1 73.4z"/>
            </svg>
          </button>
        </div>
        <button
          class="btn add-btn"
          :title="i18n.t('custom-command-add')"
          @click="addCustomCommand"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="16" height="16">
            <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
          </svg>
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
      <XTerm ref="refXterm" @fit="onFit" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ctx } from '@yank-note/runtime-api'
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, watchEffect, shallowRef } from 'vue'
import logoSvg from './assets/icon.svg'
import { i18n, proxyStorageKey, customCommandsStorageKey, ensureOpenCodeCompatible, type ActionButton, type UpdatePayload } from './lib'
import { Components } from '@yank-note/runtime-api/types/types/renderer/types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { XTerm } = ctx.components

interface CustomCommand {
  id: string
  command: string
}

// eslint-disable-next-line no-undef, func-call-spacing
const emit = defineEmits<{
  (e: 'update', payload: UpdatePayload): void
  (e: 'ref', payload: null | { focus: () => void, fitXterm: () => void, input: (data: string, addNewLine?: boolean) => void }): void
  (e: 'update:running', value: boolean): void
}>()

const editor = ctx.editor.getEditor()
const terminalReady = ref(false)
const refXterm = ref<Components.XTerm.Ref | null>(null)
const currentFileName = ref('')
const selectionLines = ref('')
const currentRepo = shallowRef(ctx.store.state.currentRepo)
const proxyUrl = ref(ctx.storage.get(proxyStorageKey, ''))
const customCommands = ref<CustomCommand[]>(normalizeCustomCommands(ctx.storage.get(customCommandsStorageKey, [])))
const deleteVisibleId = ref('')

const commandPalettes = [
  { bg: '#1d4ed8', hover: '#1e40af', shadow: 'rgba(29, 78, 216, 0.22)' },
  { bg: '#0f766e', hover: '#115e59', shadow: 'rgba(15, 118, 110, 0.22)' },
  { bg: '#b45309', hover: '#92400e', shadow: 'rgba(180, 83, 9, 0.22)' },
  { bg: '#7c3aed', hover: '#6d28d9', shadow: 'rgba(124, 58, 237, 0.22)' },
  { bg: '#be123c', hover: '#9f1239', shadow: 'rgba(190, 18, 60, 0.22)' },
]

let deleteHoverTimer: ReturnType<typeof setTimeout> | null = null

const isSameRepo = computed(() => ctx.store.state.currentRepo?.path === currentRepo.value?.path)
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

function focus () {
  refXterm.value?.getXterm()?.focus()
}

function fitXterm () {
  refXterm.value?.fit()
}

function input (data: string, addNewLine = false) {
  refXterm.value?.input(data, addNewLine)
}

function normalizeCustomCommands (value: unknown): CustomCommand[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap(item => {
    if (!item || typeof item !== 'object') {
      return []
    }

    const command = String((item as any).command || '').replace(/[\r\n]+/g, ' ').trim()
    if (!command) {
      return []
    }

    const id = String((item as any).id || createCommandId())
    return [{ id, command }]
  })
}

function createCommandId () {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getCommandStyle (index: number) {
  const palette = commandPalettes[index % commandPalettes.length]
  return {
    '--command-bg': palette.bg,
    '--command-hover': palette.hover,
    '--command-shadow': palette.shadow,
  }
}

async function addCustomCommand () {
  const command = await ctx.ui.useModal().input({
    title: i18n.t('custom-command-add'),
    hint: i18n.t('custom-command-input'),
    value: '',
    select: true,
  })

  const normalized = String(command || '').replace(/[\r\n]+/g, ' ').trim()
  if (!normalized) {
    return
  }

  customCommands.value = [
    ...customCommands.value,
    {
      id: createCommandId(),
      command: normalized,
    },
  ]
}

function removeCustomCommand (id: string) {
  customCommands.value = customCommands.value.filter(item => item.id !== id)
  if (deleteVisibleId.value === id) {
    deleteVisibleId.value = ''
  }
}

function handleCommandMouseEnter (id: string) {
  if (deleteHoverTimer) {
    clearTimeout(deleteHoverTimer)
  }

  deleteHoverTimer = setTimeout(() => {
    deleteVisibleId.value = id
  }, 2000)
}

function handleCommandMouseLeave (id: string) {
  if (deleteHoverTimer) {
    clearTimeout(deleteHoverTimer)
    deleteHoverTimer = null
  }

  if (deleteVisibleId.value === id) {
    deleteVisibleId.value = ''
  }
}

async function initTerminal (initialCommand = '') {
  if (!ensureOpenCodeCompatible()) {
    return
  }

  const normalizedCommand = initialCommand.replace(/[\r\n]+/g, ' ').trim()

  terminalReady.value = true
  emit('update:running', true)
  emitUpdate()

  await nextTick()

  if (!refXterm.value) return

  currentRepo.value = ctx.store.state.currentRepo
  const workDir = currentRepo.value?.path || ''
  const env: Record<string, string> = {}

  if (proxyUrl.value.trim()) {
    const proxy = proxyUrl.value.trim()
    env.http_proxy = proxy
    env.https_proxy = proxy
    env.HTTP_PROXY = proxy
    env.HTTPS_PROXY = proxy
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

  xterm.textarea?.addEventListener('focus', () => {
    ctx.keybinding.disableShortcuts()
  })

  xterm.textarea?.addEventListener('blur', () => {
    ctx.keybinding.enableShortcuts()
  })

  fitXterm()
  updateEditorInfo()

  if (normalizedCommand) {
    await ctx.utils.sleep(80)
    input(normalizedCommand, true)
    focus()
  }
}

function cleanup () {
  ctx.keybinding.enableShortcuts()
  refXterm.value?.dispose()
  terminalReady.value = false
  emit('update:running', false)
  emitUpdate()
}

async function stopTerminal () {
  const res = await ctx.ui.useModal().confirm({
    title: i18n.t('stop-terminal'),
    content: i18n.t('stop-terminal-confirm'),
  })

  if (res) {
    cleanup()
  }
}

async function addContext () {
  const currentFile = ctx.store.state.currentFile
  if (!currentFile || !terminalReady.value) return

  const path = currentFile.path.replace(/^\//, '')
  const text = JSON.stringify(path + (selectionLines.value ? `#L${selectionLines.value}` : '')) + ' '
  input(text)
  focus()
  ctx.ui.useToast().show('success', i18n.t('context-added'))
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

  actions.push({
    key: 'stop',
    label: i18n.t('stop-terminal'),
    title: i18n.t('stop-terminal'),
    handler: stopTerminal,
  })

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
  emit('ref', {
    focus,
    fitXterm,
    input,
  })
})

onBeforeUnmount(() => {
  if (deleteHoverTimer) {
    clearTimeout(deleteHoverTimer)
    deleteHoverTimer = null
  }
  cleanup()
  editorDisposables.forEach(d => d.dispose())
  editorDisposables = []
  emit('ref', null)
})

watch(() => [ctx.store.state.currentFile, ctx.store.state.currentRepo], () => {
  updateEditorInfo()
  emitUpdate()
})

watch([terminalReady, isSameRepo, currentFileName, selectionLines], () => {
  emitUpdate()
})

watchEffect(() => {
  if (terminalReady.value) {
    nextTick(() => {
      fitXterm()
      focus()
    })
  }
})

watchEffect(() => {
  ctx.storage.set(proxyStorageKey, proxyUrl.value)
})

watch(customCommands, value => {
  ctx.storage.set(customCommandsStorageKey, value)
}, { deep: true })
</script>

<style lang="scss" scoped>
.terminal-container {
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
    align-items: center;
    max-width: 640px;
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
    max-width: 240px;

    &.primary {
      background: var(--g-color-accent);
      color: #fff;

      &:hover {
        filter: brightness(1.1);
      }
    }
  }

  .btn-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .command-item {
    position: relative;
  }

  .command-btn {
    background: var(--command-bg);
    color: #fff;
    box-shadow: 0 10px 24px -16px var(--command-shadow);

    &:hover {
      background: var(--command-hover);
      transform: translateY(-1px);
    }
  }

  .add-btn {
    width: 44px;
    height: 44px;
    padding: 0;
    justify-content: center;
    border: 1px dashed var(--g-color-60);
    background: transparent;
    color: var(--g-color-20);

    &:hover {
      border-color: var(--g-color-accent);
      color: var(--g-color-accent);
      background: rgba(var(--g-color-accent-rgb), 0.08);
    }
  }

  .remove-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 22px;
    height: 22px;
    border: none;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.86);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 24px -18px rgba(15, 23, 42, 0.9);
    cursor: pointer;
    animation: remove-btn-in 0.18s ease-out;

    &:hover {
      background: rgba(190, 24, 93, 0.95);
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
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  background: var(--g-color-98);
}

@keyframes remove-btn-in {
  from {
    opacity: 0;
    transform: scale(0.84);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
