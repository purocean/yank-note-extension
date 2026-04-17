/* eslint-disable quote-props */
import { ref, shallowRef, type App, type Ref, type ShallowRef } from 'vue'
import { ctx } from './runtime-api'

export interface ActionButton {
  key: 'show-welcome' | 'stop'
  label: string
  title: string
  disabled?: boolean
  handler: () => void | Promise<void>
}

export interface QuickCommand {
  id: string
  name: string
  command: string
}

export interface UpdatePayload {
  terminalReady: boolean
  actions: ActionButton[]
}

export const extensionId = __EXTENSION_ID__
export const commandsStorageKey = extensionId + '.commands'
export const panelModeStorageKey = extensionId + '.panel-mode'

export type PanelMode = 'floating' | 'maximized' | 'embedded'

export const panelMode: Ref<PanelMode> = ref(ctx.storage.get(panelModeStorageKey, 'embedded') as PanelMode)
export const containerElement: ShallowRef<HTMLElement | null> = shallowRef(null)
export const containerApp: ShallowRef<App | null> = shallowRef(null)
export const containerInstance: ShallowRef<{ focus: () => void, fitXterm: () => void, showWelcome: () => void } | null> = shallowRef(null)
export const containerActions: ShallowRef<ActionButton[]> = shallowRef([])
export const floatingTarget: ShallowRef<HTMLElement | null> = shallowRef(null)
export const embeddedTarget: ShallowRef<HTMLElement | null> = shallowRef(null)

export function getDefaultShellCommand () {
  return ctx.env.isWindows ? 'cmd.exe' : 'sh'
}

export function getStoredCommands () {
  try {
    const raw = ctx.storage.get(commandsStorageKey, '[]')
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed)
      ? parsed.filter((item: any) => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.command === 'string') as QuickCommand[]
      : []
  } catch (error) {
    console.error('Failed to parse stored terminal commands', error)
    return []
  }
}

export function setFloatingTarget (el: HTMLElement | null) {
  floatingTarget.value = el
}

export function setEmbeddedTarget (el: HTMLElement | null) {
  embeddedTarget.value = el
}

export function moveContainerToTarget () {
  if (!containerElement.value) return

  const target = panelMode.value === 'embedded' ? embeddedTarget.value : floatingTarget.value
  if (target && containerElement.value.parentElement !== target) {
    target.appendChild(containerElement.value)
    setTimeout(() => {
      containerInstance.value?.fitXterm()
    }, 100)
  }
}

export function cyclePanelMode () {
  const modes: PanelMode[] = ['floating', 'maximized', 'embedded']
  const currentIndex = modes.indexOf(panelMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  panelMode.value = modes[nextIndex]
  ctx.storage.set(panelModeStorageKey, panelMode.value)
  moveContainerToTarget()
}

export const i18n = ctx.i18n.createI18n({
  en: {
    'terminal': 'Terminal',
    'open-terminal': 'Open Terminal Panel',
    'terminal-panel': 'Terminal',
    'terminal-description': 'Run shell commands in a dedicated sidebar terminal.',
    'show-welcome': 'Show Welcome',
    'hide-welcome': 'Hide Welcome',
    'open-shell': 'Open Shell',
    'focus-shell': 'Focus Shell',
    'shell-description': 'Open an interactive shell in the current workspace.',
    'quick-commands': 'Quick Commands',
    'add-command': 'Add Command',
    'edit-command': 'Edit Command',
    'delete-command': 'Delete Command',
    'delete-command-confirm': 'Delete this quick command?',
    'command-name': 'Command Name',
    'command-line': 'Command',
    'command-name-required': 'Command name is required',
    'command-line-required': 'Command is required',
    'run-command': 'Run Command',
    'saved-command': 'Saved command',
    'workspace': 'Workspace',
    'workspace-empty': 'No repository selected. Commands run from the default shell location.',
    'stop-terminal': 'Stop Terminal',
    'stop-terminal-confirm': 'Are you sure you want to close the current terminal session?',
    'close': 'Close',
    'panel-mode-floating': 'Floating',
    'panel-mode-maximized': 'Maximized',
    'panel-mode-embedded': 'Embed in Right Panel',
  },
  'zh-CN': {
    'terminal': '终端',
    'open-terminal': '打开终端面板',
    'terminal-panel': '终端',
    'terminal-description': '在独立侧栏终端中运行 Shell 命令。',
    'show-welcome': '显示欢迎页',
    'hide-welcome': '隐藏欢迎页',
    'open-shell': '打开 Shell',
    'focus-shell': '聚焦 Shell',
    'shell-description': '在当前工作区中打开一个交互式 Shell。',
    'quick-commands': '快捷命令',
    'add-command': '添加命令',
    'edit-command': '编辑命令',
    'delete-command': '删除命令',
    'delete-command-confirm': '确定删除这个快捷命令吗？',
    'command-name': '命令名称',
    'command-line': '命令内容',
    'command-name-required': '请输入命令名称',
    'command-line-required': '请输入命令内容',
    'run-command': '运行命令',
    'saved-command': '已保存命令',
    'workspace': '工作区',
    'workspace-empty': '当前未选择仓库，命令会从默认 Shell 位置运行。',
    'stop-terminal': '停止终端',
    'stop-terminal-confirm': '确定关闭当前终端会话吗？',
    'close': '关闭',
    'panel-mode-floating': '浮动窗口',
    'panel-mode-maximized': '最大化',
    'panel-mode-embedded': '嵌入右侧面板',
  }
})
