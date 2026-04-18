<template>
  <div class="terminal-container">
    <div v-if="!terminalReady" class="content">
      <div class="logo">
        <img :src="logoSvg" alt="Sidebar Terminal Logo" />
      </div>
      <h2 class="name">Sidebar Terminal</h2>
      <p class="description">{{ i18n.t('terminal-description') }}</p>
      <div class="actions">
        <button class="btn primary" @click="initTerminal">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="16" height="16">
            <path d="M73.4 182.6C60.9 170.1 60.9 149.8 73.4 137.3C85.9 124.8 106.2 124.8 118.7 137.3L278.7 297.3C291.2 309.8 291.2 330.1 278.7 342.6L118.7 502.6C106.2 515.1 85.9 515.1 73.4 502.6C60.9 490.1 60.9 469.8 73.4 457.3L210.7 320L73.4 182.6zM288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"/>
          </svg>
          {{ i18n.t('start-terminal') }}
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
import { i18n, proxyStorageKey, type ActionButton, type UpdatePayload } from './lib'
import { Components } from '@yank-note/runtime-api/types/types/renderer/types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { XTerm } = ctx.components

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

    &.primary {
      background: var(--g-color-accent);
      color: #fff;

      &:hover {
        filter: brightness(1.1);
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
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  background: var(--g-color-98);
}
</style>
