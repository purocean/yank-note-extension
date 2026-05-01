<template>
  <div class="terminal-container">
    <div v-if="!terminalReady" class="content" @click="handleContentClick">
      <div class="logo">
        <img :src="logoSvg" alt="Sidebar Terminal Logo" />
      </div>
      <h2 class="name">Sidebar Terminal</h2>
      <p class="description">{{ i18n.t('terminal-description') }}</p>
      <div :class="{ 'actions-area': true, editing: manageMode }">
        <div ref="actionsRef" :class="{ actions: true, editing: manageMode }">
          <button class="btn primary" @click.stop="handlePrimaryClick">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="16" height="16">
              <path d="M73.4 182.6C60.9 170.1 60.9 149.8 73.4 137.3C85.9 124.8 106.2 124.8 118.7 137.3L278.7 297.3C291.2 309.8 291.2 330.1 278.7 342.6L118.7 502.6C106.2 515.1 85.9 515.1 73.4 502.6C60.9 490.1 60.9 469.8 73.4 457.3L210.7 320L73.4 182.6zM288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"/>
            </svg>
            {{ i18n.t('start-terminal') }}
          </button>
          <div
            v-for="(command, index) in customCommands"
            :key="command.id"
            :data-command-id="command.id"
            :class="{ 'command-item': true, editing: manageMode, dragging: draggingCommandId === command.id }"
          >
            <button
              class="btn command-btn"
              :style="getCommandStyle(index)"
              @click.stop="handleCommandClick(command.command)"
              :title="command.command"
            >
              <span v-if="manageMode" class="drag-handle" :title="i18n.t('custom-command-drag')" @click.stop>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="10" height="14">
                  <path d="M7 4.5C7 5.3 6.3 6 5.5 6S4 5.3 4 4.5 4.7 3 5.5 3 7 3.7 7 4.5zM16 4.5C16 5.3 15.3 6 14.5 6S13 5.3 13 4.5 13.7 3 14.5 3 16 3.7 16 4.5zM7 10C7 10.8 6.3 11.5 5.5 11.5S4 10.8 4 10 4.7 8.5 5.5 8.5 7 9.2 7 10zM16 10C16 10.8 15.3 11.5 14.5 11.5S13 10.8 13 10 13.7 8.5 14.5 8.5 16 9.2 16 10zM7 15.5C7 16.3 6.3 17 5.5 17S4 16.3 4 15.5 4.7 14 5.5 14 7 14.7 7 15.5zM16 15.5C16 16.3 15.3 17 14.5 17S13 16.3 13 15.5 13.7 14 14.5 14 16 14.7 16 15.5z"/>
                </svg>
              </span>
              <svg v-if="!manageMode" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" width="16" height="16">
                <path d="M73.4 182.6C60.9 170.1 60.9 149.8 73.4 137.3C85.9 124.8 106.2 124.8 118.7 137.3L278.7 297.3C291.2 309.8 291.2 330.1 278.7 342.6L118.7 502.6C106.2 515.1 85.9 515.1 73.4 502.6C60.9 490.1 60.9 469.8 73.4 457.3L210.7 320L73.4 182.6zM288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"/>
              </svg>
              <span class="btn-text">{{ command.title }}</span>
            </button>
            <button
              v-if="manageMode"
              class="edit-btn"
              :title="i18n.t('custom-command-edit')"
              @click.stop="editCustomCommand(command)"
            >
              <svg-icon class="edit-icon" name="pen-solid" width="8px" height="8px" />
            </button>
            <button
              v-if="manageMode"
              class="remove-btn"
              :title="i18n.t('custom-command-remove')"
              @click.stop="removeCustomCommand(command.id)"
            >
              <svg-icon class="remove-icon" name="times" width="11px" height="11px" />
            </button>
          </div>
        </div>
        <div class="command-controls">
          <button
            v-if="!manageMode"
            class="btn add-btn"
            :title="i18n.t('custom-command-add')"
            @click.stop="addCustomCommand"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="16" height="16">
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
            </svg>
          </button>
          <button
            v-if="customCommands.length"
            class="manage-btn"
            :class="{ active: manageMode }"
            @click.stop="toggleManageMode"
          >
            {{ manageMode ? i18n.t('custom-command-done') : i18n.t('custom-command-manage') }}
          </button>
        </div>
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
import { ref, computed, defineComponent, h, onMounted, onBeforeUnmount, nextTick, watch, watchEffect, shallowRef } from 'vue'
import logoSvg from './assets/icon.svg'
import { i18n, proxyStorageKey, customCommandsStorageKey, ensureOpenCodeCompatible, type ActionButton, type UpdatePayload } from './lib'
import type { Components } from '@yank-note/runtime-api/types/types/renderer/types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { XTerm, SvgIcon } = ctx.components
const Sortable = ctx.lib.sortablejs

interface CustomCommand {
  id: string
  title: string
  command: string
}

interface CustomCommandDraft {
  title: string
  command: string
}

const defaultCustomCommands: CustomCommand[] = [
  {
    id: 'default-codex',
    title: 'Codex',
    command: 'codex',
  },
  {
    id: 'default-claude-code',
    title: 'Claude Code',
    command: 'claude',
  },
]

// eslint-disable-next-line no-undef, func-call-spacing
const emit = defineEmits<{
  (e: 'update', payload: UpdatePayload): void
  (e: 'ref', payload: null | { focus: () => void, fitXterm: () => void, input: (data: string, addNewLine?: boolean) => void }): void
  (e: 'update:running', value: boolean): void
}>()

const editor = ctx.editor.getEditor()
const terminalReady = ref(false)
const refXterm = ref<Components.XTerm.Ref | null>(null)
const actionsRef = ref<HTMLElement | null>(null)
const currentFileName = ref('')
const selectionLines = ref('')
const currentRepo = shallowRef(ctx.store.state.currentRepo)
const proxyUrl = ref(ctx.storage.get(proxyStorageKey, ''))
const customCommands = ref<CustomCommand[]>(loadCustomCommands())
const manageMode = ref(false)
const draggingCommandId = ref('')

const commandPalettes = [
  { bg: '#1e40af', hover: '#1e3a8a', shadow: 'rgba(30, 64, 175, 0.24)' },
  { bg: '#115e59', hover: '#134e4a', shadow: 'rgba(17, 94, 89, 0.24)' },
  { bg: '#92400e', hover: '#78350f', shadow: 'rgba(146, 64, 14, 0.24)' },
  { bg: '#6d28d9', hover: '#5b21b6', shadow: 'rgba(109, 40, 217, 0.24)' },
  { bg: '#9f1239', hover: '#881337', shadow: 'rgba(159, 18, 57, 0.24)' },
]

let commandSortable: ReturnType<typeof Sortable.create> | null = null

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

function loadCustomCommands (): CustomCommand[] {
  const value = ctx.storage.get(customCommandsStorageKey)
  if (value === undefined) {
    return defaultCustomCommands
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap(item => {
    if (!isCustomCommand(item)) {
      return []
    }

    const title = normalizeTitle(item.title)
    const command = normalizeCommand(item.command)
    if (!command) {
      return []
    }

    return [{
      id: item.id,
      title,
      command,
    }]
  })
}

function isCustomCommand (value: unknown): value is CustomCommand {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Record<string, unknown>
  return typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.command === 'string'
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

function normalizeTitle (value: unknown) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim()
}

function normalizeCommand (value: unknown) {
  return String(value || '').replace(/\r\n?/g, '\n').trim()
}

async function showCustomCommandDialog (title: string, value?: CustomCommandDraft): Promise<CustomCommandDraft | null> {
  const titleValue = ref(value?.title || '')
  const commandValue = ref(value?.command || '')

  const FormComponent = defineComponent({
    setup () {
      return () => h('div', { class: 'custom-command-form' }, [
        h('label', { class: 'custom-command-field' }, [
          h('span', i18n.t('custom-command-title-input')),
          h('input', {
            value: titleValue.value,
            placeholder: i18n.t('custom-command-title-input'),
            onInput: (event: Event) => {
              titleValue.value = (event.target as HTMLInputElement).value
            },
          }),
        ]),
        h('label', { class: 'custom-command-field' }, [
          h('span', i18n.t('custom-command-input')),
          h('textarea', {
            value: commandValue.value,
            rows: 5,
            placeholder: i18n.t('custom-command-input'),
            onInput: (event: Event) => {
              commandValue.value = (event.target as HTMLTextAreaElement).value
            },
          }),
        ]),
      ])
    },
  })

  const ok = await ctx.ui.useModal().confirm({
    title,
    component: FormComponent,
    modalWidth: '460px',
  })

  if (!ok) {
    return null
  }

  const normalizedTitle = normalizeTitle(titleValue.value)
  const normalizedCommand = normalizeCommand(commandValue.value)
  if (!normalizedTitle || !normalizedCommand) {
    return null
  }

  return {
    title: normalizedTitle,
    command: normalizedCommand,
  }
}

async function addCustomCommand () {
  const draft = await showCustomCommandDialog(i18n.t('custom-command-add'))
  if (!draft) {
    return
  }

  customCommands.value = [
    ...customCommands.value,
    {
      id: createCommandId(),
      title: draft.title,
      command: draft.command,
    },
  ]
}

async function editCustomCommand (target: CustomCommand) {
  const draft = await showCustomCommandDialog(i18n.t('custom-command-edit'), target)
  if (!draft) {
    return
  }

  customCommands.value = customCommands.value.map(item => {
    if (item.id !== target.id) {
      return item
    }

    return {
      ...item,
      title: draft.title,
      command: draft.command,
    }
  })
}

function removeCustomCommand (id: string) {
  customCommands.value = customCommands.value.filter(item => item.id !== id)
  if (!customCommands.value.length) {
    manageMode.value = false
  }
}

function toggleManageMode () {
  manageMode.value = !manageMode.value
}

function handleContentClick (event: MouseEvent) {
  if (!manageMode.value) {
    return
  }

  const target = event.target as HTMLElement
  if (!target.closest('.actions')) {
    manageMode.value = false
  }
}

function handleCommandClick (command: string) {
  if (manageMode.value) {
    manageMode.value = false
    return
  }

  initTerminal(command)
}

function handlePrimaryClick () {
  if (manageMode.value) {
    manageMode.value = false
    return
  }

  initTerminal()
}

function handleKeydown (event: KeyboardEvent) {
  if (event.key === 'Escape' && manageMode.value) {
    manageMode.value = false
  }
}

function setupCommandSortable () {
  if (!actionsRef.value) {
    return
  }

  if (!commandSortable) {
    commandSortable = Sortable.create(actionsRef.value, {
      animation: 180,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      draggable: '.command-item',
      handle: '.command-btn',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      disabled: !manageMode.value,
      onStart: event => {
        draggingCommandId.value = (event.item as HTMLElement).dataset.commandId || ''
      },
      onEnd: event => {
        draggingCommandId.value = ''
        const oldIndex = event.oldDraggableIndex
        const newIndex = event.newDraggableIndex
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
          return
        }

        const next = [...customCommands.value]
        const [source] = next.splice(oldIndex, 1)
        next.splice(newIndex, 0, source)
        customCommands.value = next
      },
    })
  }

  commandSortable.option('disabled', !manageMode.value)
}

function destroyCommandSortable () {
  commandSortable?.destroy()
  commandSortable = null
}

async function initTerminal (initialCommand = '') {
  if (!ensureOpenCodeCompatible()) {
    return
  }

  const normalizedCommand = normalizeCommand(initialCommand)

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
  window.addEventListener('keydown', handleKeydown)
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
  nextTick(setupCommandSortable)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  destroyCommandSortable()
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
  nextTick(setupCommandSortable)
}, { deep: true })

watch(manageMode, () => {
  nextTick(setupCommandSortable)
})

watch(terminalReady, value => {
  if (value) {
    destroyCommandSortable()
  } else {
    nextTick(setupCommandSortable)
  }
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
    margin: 0 0 22px 0;
    font-size: 14px;
    color: var(--g-color-40);
    max-width: 300px;
  }

  .actions-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    max-width: 500px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border: none;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    max-width: 156px;

    &.primary {
      background: var(--g-color-accent);
      color: #fff;

      &:hover {
        filter: brightness(1.1);
      }
    }

    > svg {
      width: 14px;
      height: 14px;
      flex: none;
    }
  }

  .btn-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .command-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    transition: opacity 0.16s ease, transform 0.16s ease;

    &.dragging {
      opacity: 0.62;
    }
  }

  .command-btn {
    background: var(--command-bg);
    color: #fff;
    box-shadow: 0 10px 24px -16px var(--command-shadow);

    &:hover {
      background: var(--command-hover);
    }
  }

  .command-item.editing .command-btn {
    padding-left: 22px;
    cursor: grab !important;

    &:active {
      cursor: grabbing !important;
    }

    * {
      cursor: inherit !important;
    }
  }

  .add-btn {
    width: 32px;
    min-width: 32px;
    height: 32px;
    padding: 0;
    border: 1px dashed var(--g-color-60);
    background: transparent;
    color: var(--g-color-20);
    border-radius: 8px;
    transition: color 0.16s ease, background 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;

    &:hover {
      border-color: var(--g-color-accent);
      color: var(--g-color-accent);
      background: rgba(var(--g-color-accent-rgb), 0.08);
    }
  }

  .command-controls {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;

    .add-btn,
    .manage-btn {
      opacity: 0;
      transition-delay: 0s;
    }
  }

  .drag-handle {
    position: absolute;
    left: 7px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
    touch-action: none;

    pointer-events: none;
  }

  .edit-btn,
  .remove-btn {
    position: absolute;
    top: -6px;
    width: 18px;
    height: 18px;
    padding: 0;
    box-sizing: border-box;
    border: none;
    border-radius: 999px;
    background: rgba(31, 41, 55, 0.92);
    color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    box-shadow: 0 7px 16px -10px rgba(15, 23, 42, 0.95);
    cursor: default;
    opacity: 0;
    pointer-events: none;
    animation: remove-btn-in 0.18s ease-out;

    * {
      cursor: default;
    }

    &:hover {
      color: #fff;
    }
  }

  .edit-btn {
    right: 14px;

    &:hover {
      background: rgba(37, 99, 235, 0.96);
    }

    :deep(.edit-icon) {
      width: 8px !important;
      height: 8px !important;
      min-width: 8px;
      display: block;
      line-height: 0;
    }
  }

  .remove-btn {
    right: -6px;

    &:hover {
      background: rgba(220, 38, 38, 0.96);
    }

    :deep(.remove-icon) {
      width: 10px !important;
      height: 10px !important;
      min-width: 10px;
      display: block;
      line-height: 0;
    }
  }

  .command-item:hover {
    .edit-btn,
    .remove-btn {
      opacity: 1;
      pointer-events: auto;
    }
  }

  .sortable-chosen .command-btn {
    cursor: grabbing !important;
    filter: brightness(1.04);

    * {
      cursor: inherit !important;
    }
  }

  .sortable-ghost {
    opacity: 0.28;

    .command-btn {
      box-shadow: none;
    }
  }

  .sortable-drag {
    cursor: grabbing !important;
    opacity: 0.9;
    filter: drop-shadow(0 12px 18px rgba(15, 23, 42, 0.18));

    .command-btn,
    .command-btn * {
      cursor: grabbing !important;
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

  .manage-btn {
    border: none;
    background: transparent;
    color: var(--g-color-45);
    font-size: 12px;
    line-height: 1;
    padding: 0 2px;
    height: 32px;
    cursor: pointer;
    transition: color 0.16s ease, opacity 0.16s ease;

    &:hover,
    &.active {
      color: var(--g-color-20);
    }
  }

  .actions-area:hover .command-controls,
  .command-controls:focus-within {
    .add-btn,
    .manage-btn {
      opacity: 1;
      transition-delay: 0.5s;
    }
  }

  .actions-area.editing .command-controls {
    .add-btn,
    .manage-btn {
      opacity: 1;
      transition-delay: 0s;
    }
  }
}

:global(.custom-command-form) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  padding: 2px 0 4px;
}

:global(.custom-command-field) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--g-color-30);
}

:global(.custom-command-field input),
:global(.custom-command-field textarea) {
  width: 100%;
  box-sizing: border-box;
}

:global(.custom-command-field input) {
  height: 32px;
}

:global(.custom-command-field textarea) {
  min-height: 112px;
  resize: vertical;
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
  }

  to {
    opacity: 1;
  }
}
</style>
