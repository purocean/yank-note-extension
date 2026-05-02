<template>
  <div class="terminal-container">
    <TerminalLauncher
      v-if="!terminalReady"
      v-model:proxy-url="proxyUrl"
      :custom-commands="customCommands"
      :manage-mode="manageMode"
      @add-command="addCustomCommand"
      @command-click="handleCommandClick"
      @edit-command="editCustomCommand"
      @leave-manage="manageMode = false"
      @primary-click="handlePrimaryClick"
      @remove-command="removeCustomCommand"
      @reorder-command="reorderCustomCommand"
      @toggle-manage="toggleManageMode"
    />
    <div v-if="terminalReady" class="terminal-workspace">
      <div class="terminal-tabs">
        <div
          v-for="tab in terminalTabs"
          :key="tab.id"
          :class="{ 'terminal-tab': true, active: tab.id === activeTabId }"
          :title="tab.title"
          @click="setActiveTab(tab.id)"
        >
          <span class="terminal-tab-title">{{ tab.title }}</span>
          <button
            class="terminal-tab-close"
            :title="i18n.t('close-tab')"
            @click.stop="closeTerminalTab(tab.id)"
          >
            <svg-icon name="times" width="8px" height="8px" />
          </button>
        </div>
        <button v-if="!showLauncher" class="terminal-tab-add" :title="i18n.t('new-tab')" @click="showNewTabLauncher">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="10" height="10">
            <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
          </svg>
        </button>
      </div>
      <TerminalLauncher
        v-if="showLauncher"
        v-model:proxy-url="proxyUrl"
        class="tab-launcher"
        :custom-commands="customCommands"
        :manage-mode="manageMode"
        @add-command="addCustomCommand"
        @command-click="handleCommandClick"
        @edit-command="editCustomCommand"
        @leave-manage="manageMode = false"
        @primary-click="handlePrimaryClick"
        @remove-command="removeCustomCommand"
        @reorder-command="reorderCustomCommand"
        @toggle-manage="toggleManageMode"
      />
      <div v-show="!showLauncher" class="xterm-container">
        <div
          v-for="tab in terminalTabs"
          :key="tab.id"
          v-show="tab.id === activeTabId"
          class="xterm-pane"
        >
          <XTerm :ref="bindTerminalRef(tab.id)" @fit="onFit(tab.id)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ctx } from '@yank-note/runtime-api'
import { ref, computed, defineComponent, h, onMounted, onBeforeUnmount, nextTick, watch, watchEffect } from 'vue'
import TerminalLauncher from './TerminalLauncher.vue'
import { i18n, proxyStorageKey, customCommandsStorageKey, ensureOpenCodeCompatible, type ActionButton, type CustomCommand, type UpdatePayload } from './lib'
import type { Components } from '@yank-note/runtime-api/types/types/renderer/types'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { XTerm, SvgIcon } = ctx.components
type CustomCommandDraft = Omit<CustomCommand, 'id'>

interface TerminalTab {
  id: string
  title: string
  repoName: string
  repoPath: string
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

const noProxyHosts = [
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '169.254.0.0/16',
  '.local',
]

// eslint-disable-next-line no-undef, func-call-spacing
const emit = defineEmits<{
  (e: 'update', payload: UpdatePayload): void
  (e: 'ref', payload: null | { focus: () => void, fitXterm: () => void, input: (data: string, addNewLine?: boolean) => void }): void
  (e: 'update:running', value: boolean): void
}>()

const editor = ctx.editor.getEditor()
const terminalTabs = ref<TerminalTab[]>([])
const activeTabId = ref('')
const launcherVisible = ref(true)
const currentFileName = ref('')
const selectionLines = ref('')
const proxyUrl = ref(ctx.storage.get(proxyStorageKey, ''))
const customCommands = ref<CustomCommand[]>(loadCustomCommands())
const manageMode = ref(false)

const terminalRefs = new Map<string, Components.XTerm.Ref>()
const closingTabIds = new Set<string>()

const terminalReady = computed(() => terminalTabs.value.length > 0)
const showLauncher = computed(() => !terminalReady.value || launcherVisible.value)
const activeTab = computed(() => terminalTabs.value.find(tab => tab.id === activeTabId.value) || null)
const isSameRepo = computed(() => !!activeTab.value && ctx.store.state.currentRepo?.path === activeTab.value.repoPath)
const displayFileName = computed(() => {
  const name = currentFileName.value
  if (name.length > 20) {
    return name.slice(0, 8) + '...' + name.slice(-9)
  }
  return name
})

function updateEditorInfo () {
  const currentFile = ctx.store.state.currentFile
  if (currentFile && currentFile.plain && activeTab.value?.repoName === currentFile.repo) {
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
  getActiveXtermRef()?.getXterm()?.focus()
}

function fitXterm () {
  getActiveXtermRef()?.fit()
}

function input (data: string, addNewLine = false) {
  getActiveXtermRef()?.input(data, addNewLine)
}

function getActiveXtermRef () {
  return activeTabId.value ? terminalRefs.get(activeTabId.value) || null : null
}

function loadCustomCommands (): CustomCommand[] {
  const value = ctx.storage.get(customCommandsStorageKey)
  if (value === undefined) {
    return defaultCustomCommands.map(item => ({ ...item }))
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
    if (!title || !command) {
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

function createTerminalTitle (baseTitle: string) {
  const title = normalizeTitle(baseTitle) || 'Shell'
  const duplicateTitles = terminalTabs.value
    .map(tab => tab.title)
    .filter(tabTitle => tabTitle === title || new RegExp(`^${escapeRegExp(title)} \\d+$`).test(tabTitle))

  return duplicateTitles.length ? `${title} ${duplicateTitles.length + 1}` : title
}

function escapeRegExp (value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
            maxlength: 10,
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

function handleCommandClick (command: CustomCommand) {
  if (manageMode.value) {
    manageMode.value = false
    return
  }

  initTerminal(command.title, command.command)
}

function handlePrimaryClick () {
  if (manageMode.value) {
    manageMode.value = false
    return
  }

  initTerminal('Shell')
}

function handleKeydown (event: KeyboardEvent) {
  if (event.key === 'Escape' && manageMode.value) {
    manageMode.value = false
  }
}

function reorderCustomCommand (oldIndex: number, newIndex: number) {
  if (oldIndex === newIndex) {
    return
  }

  const next = [...customCommands.value]
  const [source] = next.splice(oldIndex, 1)
  next.splice(newIndex, 0, source)
  customCommands.value = next
}

function setTerminalRef (tabId: string, instance: Components.XTerm.Ref | null) {
  if (instance) {
    terminalRefs.set(tabId, instance)
  } else {
    terminalRefs.delete(tabId)
  }
}

function bindTerminalRef (tabId: string) {
  return (instance: Components.XTerm.Ref | null) => {
    setTerminalRef(tabId, instance)
  }
}

function setActiveTab (tabId: string) {
  if (activeTabId.value === tabId) {
    launcherVisible.value = false
    return
  }

  activeTabId.value = tabId
  launcherVisible.value = false
  updateEditorInfo()
  emitUpdate()
  nextTick(() => {
    fitXterm()
    focus()
  })
}

function showNewTabLauncher () {
  activeTabId.value = ''
  launcherVisible.value = true
  emitUpdate()
}

async function closeTerminalTab (tabId: string) {
  const res = await ctx.ui.useModal().confirm({
    title: i18n.t('stop-terminal'),
    content: i18n.t('stop-terminal-confirm'),
  })

  if (res) {
    cleanupTab(tabId)
  }
}

async function initTerminal (title = 'Shell', initialCommand = '') {
  if (!ensureOpenCodeCompatible()) {
    return
  }

  const normalizedCommand = normalizeCommand(initialCommand)
  const currentRepo = ctx.store.state.currentRepo
  const tab: TerminalTab = {
    id: createCommandId(),
    title: createTerminalTitle(title),
    repoName: currentRepo?.name || '',
    repoPath: currentRepo?.path || '',
  }

  terminalTabs.value = [...terminalTabs.value, tab]
  activeTabId.value = tab.id
  launcherVisible.value = false
  emit('update:running', true)
  emitUpdate()

  await nextTick()

  const refXterm = terminalRefs.get(tab.id)
  if (!refXterm) {
    cleanupTab(tab.id)
    return
  }

  const workDir = tab.repoPath
  const env: Record<string, string> = {}

  if (proxyUrl.value.trim()) {
    const proxy = proxyUrl.value.trim()
    env.http_proxy = proxy
    env.https_proxy = proxy
    env.HTTP_PROXY = proxy
    env.HTTPS_PROXY = proxy
    env.no_proxy = noProxyHosts.join(',')
    env.NO_PROXY = env.no_proxy
  }

  try {
    refXterm.init({
      cwd: workDir,
      fontSize: 13,
      env,
      onDisconnect () {
        cleanupTab(tab.id)
      },
    })

    await ctx.utils.sleep(100)

    const xterm = refXterm.getXterm()
    if (!xterm) {
      cleanupTab(tab.id)
      return
    }

    xterm.textarea?.addEventListener('focus', () => {
      ctx.keybinding.disableShortcuts()
    })

    xterm.textarea?.addEventListener('blur', () => {
      ctx.keybinding.enableShortcuts()
    })

    if (activeTabId.value === tab.id) {
      fitXterm()
      focus()
    }
    updateEditorInfo()

    if (normalizedCommand) {
      await ctx.utils.sleep(80)
      refXterm.input(normalizedCommand, true)
      if (activeTabId.value === tab.id) {
        focus()
      }
    }
  } catch (error) {
    console.error('[sidebar-terminal] failed to initialize terminal', error)
    cleanupTab(tab.id)
  }
}

function cleanup () {
  terminalTabs.value.forEach(tab => {
    closingTabIds.add(tab.id)
    terminalRefs.get(tab.id)?.dispose()
    closingTabIds.delete(tab.id)
  })
  terminalRefs.clear()
  terminalTabs.value = []
  activeTabId.value = ''
  launcherVisible.value = true
  ctx.keybinding.enableShortcuts()
  emit('update:running', false)
  emitUpdate()
}

function cleanupTab (tabId: string) {
  if (!tabId || closingTabIds.has(tabId)) {
    return
  }

  closingTabIds.add(tabId)
  terminalRefs.get(tabId)?.dispose()
  terminalRefs.delete(tabId)
  closingTabIds.delete(tabId)

  const index = terminalTabs.value.findIndex(tab => tab.id === tabId)
  if (index < 0) {
    return
  }

  terminalTabs.value = terminalTabs.value.filter(tab => tab.id !== tabId)

  if (!terminalTabs.value.length) {
    activeTabId.value = ''
    launcherVisible.value = true
    ctx.keybinding.enableShortcuts()
  } else {
    if (activeTabId.value === tabId) {
      const nextTab = terminalTabs.value[Math.min(index, terminalTabs.value.length - 1)] || terminalTabs.value[terminalTabs.value.length - 1] || null
      activeTabId.value = nextTab?.id || ''
    }
    launcherVisible.value = activeTabId.value ? false : launcherVisible.value
  }

  emit('update:running', terminalTabs.value.length > 0)
  updateEditorInfo()
  emitUpdate()

  nextTick(() => {
    fitXterm()
    focus()
  })
}

async function addContext () {
  const currentFile = ctx.store.state.currentFile
  if (!currentFile || !activeTab.value) return

  const path = currentFile.path.replace(/^\//, '')
  const text = JSON.stringify(path + (selectionLines.value ? `#L${selectionLines.value}` : '')) + ' '
  input(text)
  focus()
}

function onFit (tabId = activeTabId.value) {
  const element = terminalRefs.get(tabId)?.getXterm()?.element as HTMLElement
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

  if (!activeTab.value) {
    return actions
  }

  if (isSameRepo.value && currentFileName.value) {
    actions.push({
      key: 'add-context',
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
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
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

.terminal-workspace {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--g-color-98);
}

.terminal-tabs {
  position: relative;
  z-index: 2;
  height: 28px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 5px 2px;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid var(--g-color-85);
  background: rgba(var(--g-color-90-rgb), 0.94);

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--g-color-70);
    border-radius: 999px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.terminal-tab {
  height: 22px;
  min-width: 58px;
  max-width: 128px;
  padding: 0 3px 0 7px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 6px;
  color: var(--g-color-35);
  cursor: default;
  user-select: none;
  border: 1px solid transparent;
  background: transparent;

  &:hover {
    color: var(--g-color-10);
    background: var(--g-color-80);
  }

  &.active {
    color: var(--g-color-5);
    background: var(--g-color-80);
    border-color: var(--g-color-75);
  }
}

.terminal-tab-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.terminal-tab-close,
.terminal-tab-add {
  flex: none;
  border: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: default;
}

.terminal-tab-close {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: transparent;
  opacity: 0.6;

  &:hover {
    opacity: 1;
    background: var(--g-color-70);
  }
}

.terminal-tab-add {
  width: 20px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--g-color-35);

  &:hover {
    background: var(--g-color-85);
  }
}

.xterm-container {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  padding: 0;
  box-sizing: border-box;
  background: var(--g-color-98);
}

.xterm-pane {
  width: 100%;
  height: 100%;
}

</style>
