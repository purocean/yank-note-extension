<template>
  <div class="terminal-container">
    <div v-if="terminalReady" class="xterm-container">
      <x-term ref="refXterm" @fit="onFit" />
    </div>

    <div v-else class="loading-shell">
      <div class="loading-shell__spinner" />
      <div class="loading-shell__text">{{ i18n.t('open-shell') }}</div>
    </div>

    <div v-if="showWelcome" class="welcome-overlay">
      <div class="welcome-card">
        <div class="welcome-card__header">
          <div>
            <h2>{{ i18n.t('terminal-panel') }}</h2>
            <p>{{ i18n.t('terminal-description') }}</p>
          </div>
          <button class="icon-btn" :title="i18n.t('hide-welcome')" @click="showWelcome = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" width="14" height="14">
              <path d="M312.1 375c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 335.9 64.5 431.5c-9.4 9.4-24.6 9.4-33.9 0L8 408.9c-9.4-9.4-9.4-24.6 0-33.9L103.5 279.4 8 183.9c-9.4-9.4-9.4-24.6 0-33.9L30.6 127.4c9.4-9.4 24.6-9.4 33.9 0l95.5 95.5 95.5-95.5c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9L216.5 279.4 312.1 375z" />
            </svg>
          </button>
        </div>

        <div class="workspace-panel">
          <div class="workspace-panel__label">{{ i18n.t('workspace') }}</div>
          <div class="workspace-panel__value">{{ workspaceLabel }}</div>
        </div>

        <div class="quick-commands">
          <div class="quick-commands__header">
            <span>{{ i18n.t('quick-commands') }}</span>
            <button class="btn btn-secondary" @click="addCommand">{{ i18n.t('add-command') }}</button>
          </div>

          <div class="command-grid">
            <button class="command-card command-card--shell" @click="runShell">
              <span class="command-card__badge">{{ i18n.t('open-shell') }}</span>
              <strong>{{ shellTitle }}</strong>
              <code>{{ defaultShellCommand }}</code>
              <small>{{ i18n.t('shell-description') }}</small>
            </button>

            <div v-for="item in commands" :key="item.id" class="command-card-wrap">
              <button class="command-card" @click="runQuickCommand(item.command)">
                <span class="command-card__badge">{{ i18n.t('saved-command') }}</span>
                <strong>{{ item.name }}</strong>
                <code>{{ item.command }}</code>
                <small>{{ i18n.t('run-command') }}</small>
              </button>
              <div class="command-card-actions">
                <button class="icon-btn" :title="i18n.t('edit-command')" @click.stop="editCommand(item)">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="12" height="12">
                    <path d="M362.7 19.3c25-25 65.5-25 90.5 0l39.5 39.5c25 25 25 65.5 0 90.5L213.3 428.7c-8.4 8.4-18.8 14.5-30.3 17.8l-92.8 26.5c-8.4 2.4-17.5 .1-23.7-6.1s-8.5-15.3-6.1-23.7l26.5-92.8c3.3-11.5 9.4-21.9 17.8-30.3L362.7 19.3z" />
                  </svg>
                </button>
                <button class="icon-btn" :title="i18n.t('delete-command')" @click.stop="removeCommand(item)">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="12" height="12">
                    <path d="M135.2 17.7C140.6 7.1 151.5 0 163.5 0H284.5c12.1 0 23 7.1 28.3 17.7L328 48H432c8.8 0 16 7.2 16 16V96c0 8.8-7.2 16-16 16H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V112H16C7.2 112 0 104.8 0 96V64C0 55.2 7.2 48 16 48H120l15.2-30.3zM80 112V448c0 8.8 7.2 16 16 16H352c8.8 0 16-7.2 16-16V112H80z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import type { ActionButton, QuickCommand, UpdatePayload } from './lib'
import { commandsStorageKey, getDefaultShellCommand, getStoredCommands, i18n } from './lib'
import { ctx } from './runtime-api'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { XTerm } = ctx.components

// eslint-disable-next-line no-undef, func-call-spacing
const emit = defineEmits<{
  (e: 'update', payload: UpdatePayload): void
  (e: 'ref', payload: null | { focus: () => void, fitXterm: () => void, showWelcome: () => void }): void
  (e: 'update:running', value: boolean): void
}>()

type XTermRef = {
  init: (opts?: Record<string, any>) => void
  input: (data: string, addNewLine?: boolean) => void
  fit: () => void
  dispose: () => void
  getXterm: () => any
}

const terminalReady = ref(false)
const showWelcome = ref(true)
const refXterm = ref<XTermRef | null>(null)
const commands = ref<QuickCommand[]>(getStoredCommands())
const workspaceLabel = computed(() => ctx.store.state.currentRepo?.path || i18n.t('workspace-empty'))
const defaultShellCommand = getDefaultShellCommand()
const shellTitle = computed(() => terminalReady.value ? i18n.t('focus-shell') : i18n.t('open-shell'))

let initTask: Promise<void> | null = null

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
  if (terminalReady.value) {
    return
  }

  if (initTask) {
    return initTask
  }

  initTask = (async () => {
    terminalReady.value = true
    emit('update:running', true)
    emitUpdate()

    await nextTick()

    if (!refXterm.value) {
      terminalReady.value = false
      emit('update:running', false)
      emitUpdate()
      return
    }

    refXterm.value.init({
      cwd: ctx.store.state.currentRepo?.path || '',
      fontSize: 13,
      onDisconnect () {
        cleanup()
      },
    })

    await ctx.utils.sleep(100)

    const xterm = refXterm.value.getXterm()
    xterm?.textarea?.addEventListener('focus', () => {
      ctx.keybinding.disableShortcuts()
    })
    xterm?.textarea?.addEventListener('blur', () => {
      ctx.keybinding.enableShortcuts()
    })

    fitXterm()
    focus()
  })()

  try {
    await initTask
  } finally {
    initTask = null
  }
}

function cleanup () {
  initTask = null
  ctx.keybinding.enableShortcuts()
  refXterm.value?.dispose()
  terminalReady.value = false
  emit('update:running', false)
  emitUpdate()
  showWelcome.value = true
}

async function ensureTerminalReady () {
  await initTerminal()
  await nextTick()
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

async function runShell () {
  await ensureTerminalReady()
  showWelcome.value = false
  focus()
}

async function runQuickCommand (command: string) {
  if (!command.trim()) {
    return
  }

  await ensureTerminalReady()
  input(command, true)
  showWelcome.value = false
  focus()
}

async function promptCommand (title: string, initial?: Partial<QuickCommand>) {
  const commandValue = ref(initial?.command || '')
  const name = await ctx.ui.useModal().input({
    title,
    hint: i18n.t('command-name'),
    value: initial?.name || '',
    modalWidth: '680px',
    select: true,
    component: h('div', { style: 'margin-top: 12px;' }, [
      h('div', { style: 'margin-bottom: 6px; color: var(--g-color-30); font-size: 12px;' }, i18n.t('command-line')),
      h('textarea', {
        rows: 5,
        value: commandValue.value,
        style: 'width: 100%; min-height: 120px; resize: vertical; box-sizing: border-box;',
        spellcheck: false,
        onInput: (event: Event) => {
          commandValue.value = (event.target as HTMLTextAreaElement).value
        },
      }),
    ]),
  })

  if (name === null) {
    return null
  }

  if (!name.trim()) {
    ctx.ui.useToast().show('warning', i18n.t('command-name-required'))
    return null
  }

  if (!commandValue.value.trim()) {
    ctx.ui.useToast().show('warning', i18n.t('command-line-required'))
    return null
  }

  return {
    id: initial?.id || globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(16).slice(2),
    name: name.trim(),
    command: commandValue.value.trim(),
  } satisfies QuickCommand
}

async function addCommand () {
  const command = await promptCommand(i18n.t('add-command'))
  if (!command) {
    return
  }

  commands.value = [...commands.value, command]
}

async function editCommand (item: QuickCommand) {
  const command = await promptCommand(i18n.t('edit-command'), item)
  if (!command) {
    return
  }

  commands.value = commands.value.map(current => current.id === item.id ? command : current)
}

async function removeCommand (item: QuickCommand) {
  const confirmed = await ctx.ui.useModal().confirm({
    title: i18n.t('delete-command'),
    content: i18n.t('delete-command-confirm'),
  })

  if (confirmed) {
    commands.value = commands.value.filter(current => current.id !== item.id)
  }
}

function buildActions (): ActionButton[] {
  const actions: ActionButton[] = [
    {
      key: 'show-welcome',
      label: i18n.t('show-welcome'),
      title: i18n.t('show-welcome'),
      handler: () => {
        showWelcome.value = true
        nextTick(() => fitXterm())
      },
    },
  ]

  if (terminalReady.value) {
    actions.unshift({
      key: 'stop',
      label: i18n.t('stop-terminal'),
      title: i18n.t('stop-terminal'),
      handler: stopTerminal,
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

function onFit () {
  const element = refXterm.value?.getXterm()?.element as HTMLElement
  if (!element) {
    return
  }

  const width = element.offsetWidth || 0
  const xtermScreen = element.querySelector('.xterm-screen') as HTMLElement
  const xtermScreenWidth = xtermScreen?.offsetWidth || 0
  const paddingLeft = Math.max(0, (width - xtermScreenWidth) / 2) + 1
  if (xtermScreen) {
    xtermScreen.style.marginLeft = paddingLeft + 'px'
  }
}

onMounted(() => {
  emitUpdate()
  emit('ref', {
    focus,
    fitXterm,
    showWelcome: () => {
      showWelcome.value = true
    },
  })

  initTerminal().catch(error => {
    console.error('Failed to initialize terminal', error)
  })
})

onBeforeUnmount(() => {
  cleanup()
  emit('ref', null)
})

watch(commands, value => {
  ctx.storage.set(commandsStorageKey, JSON.stringify(value))
  emitUpdate()
}, { deep: true })

watch(() => ctx.store.state.currentRepo?.path, () => {
  emitUpdate()
})

watch(showWelcome, () => {
  nextTick(() => fitXterm())
})

watchEffect(() => {
  if (terminalReady.value) {
    nextTick(() => fitXterm())
  }
})
</script>

<style lang="scss" scoped>
.terminal-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--g-color-98);
  overflow: hidden;
}

.xterm-container,
.loading-shell {
  width: 100%;
  height: 100%;
}

.loading-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--g-color-30);

  &__spinner {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 3px solid rgba(var(--g-color-accent-rgb), 0.2);
    border-top-color: var(--g-color-accent);
    animation: spin 1s linear infinite;
  }
}

.welcome-overlay {
  position: absolute;
  inset: 0;
  padding: 16px;
  box-sizing: border-box;
  background: rgba(var(--g-color-98-rgb), 0.86);
  backdrop-filter: blur(8px);
  overflow: auto;
}

.welcome-card {
  max-width: 920px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid rgba(var(--g-color-50-rgb), 0.2);
  border-radius: 14px;
  background: rgba(var(--g-color-95-rgb), 0.96);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      color: var(--g-color-10);
      font-size: 24px;
    }

    p {
      margin: 8px 0 0;
      color: var(--g-color-35);
      font-size: 14px;
    }
  }
}

.workspace-panel {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(var(--g-color-80-rgb), 0.6);

  &__label {
    margin-bottom: 4px;
    font-size: 12px;
    color: var(--g-color-35);
  }

  &__value {
    word-break: break-all;
    color: var(--g-color-15);
    font-family: var(--g-font-family-monospace, monospace);
    font-size: 13px;
  }
}

.quick-commands {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
    color: var(--g-color-20);
    font-weight: 600;
  }
}

.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.command-card-wrap {
  position: relative;
}

.command-card {
  width: 100%;
  min-height: 170px;
  padding: 16px;
  border: 1px solid rgba(var(--g-color-accent-rgb), 0.14);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(var(--g-color-100-rgb), 0.95) 0%, rgba(var(--g-color-95-rgb), 0.95) 100%);
  color: var(--g-color-10);
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--g-color-accent-rgb), 0.4);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  }

  strong {
    font-size: 16px;
  }

  code {
    display: block;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(var(--g-color-80-rgb), 0.8);
    color: var(--g-color-15);
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 12px;
  }

  small {
    color: var(--g-color-35);
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(var(--g-color-accent-rgb), 0.12);
    color: var(--g-color-accent);
    font-size: 11px;
    font-weight: 600;
  }

  &--shell {
    border-color: rgba(var(--g-color-success-rgb, 34, 197, 94), 0.2);
  }
}

.command-card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
}

.btn,
.icon-btn {
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;

  &.btn-secondary {
    background: rgba(var(--g-color-accent-rgb), 0.12);
    color: var(--g-color-accent);

    &:hover {
      background: rgba(var(--g-color-accent-rgb), 0.18);
    }
  }
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(var(--g-color-80-rgb), 0.75);
  color: var(--g-color-15);
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(var(--g-color-accent-rgb), 0.14);
    color: var(--g-color-accent);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
