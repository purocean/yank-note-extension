/* eslint-disable quote-props */
import { ctx } from '@yank-note/runtime-api'
import { ref, shallowRef, type Ref, type ShallowRef, type App } from 'vue'

export interface UpdatePayload {
  terminalReady: boolean
  actions: ActionButton[]
}

export interface ActionButton {
  key: 'stop' | 'add-context'
  label: string
  title: string
  disabled?: boolean
  handler: () => void | Promise<void>
  meta?: {
    fileName?: string
    displayFileName?: string
    selectionLines?: string
  }
}

export const extensionId = __EXTENSION_ID__
export const openCodeExtensionId = '@yank-note/extension-opencode'
export const requiredOpenCodeVersion = '>=1.2.4'
export const proxyStorageKey = extensionId + '.proxy-url'
export const panelModeStorageKey = extensionId + '.panel-mode'
export const customCommandsStorageKey = extensionId + '.custom-commands'

export type PanelMode = 'floating' | 'maximized' | 'embedded'

export const panelMode: Ref<PanelMode> = ref(ctx.storage.get(panelModeStorageKey, 'embedded') as PanelMode)
export const containerElement: ShallowRef<HTMLElement | null> = shallowRef(null)
export const containerApp: ShallowRef<App | null> = shallowRef(null)
export const containerInstance: ShallowRef<{ focus: () => void, fitXterm: () => void } | null> = shallowRef(null)
export const containerActions: ShallowRef<ActionButton[]> = shallowRef([])
export const floatingTarget: ShallowRef<HTMLElement | null> = shallowRef(null)
export const embeddedTarget: ShallowRef<HTMLElement | null> = shallowRef(null)

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
    'terminal': 'Sidebar Terminal',
    'open-terminal': 'Open Sidebar Terminal Panel',
    'terminal-panel': 'Sidebar Terminal',
    'terminal-description': 'Run shell commands in a dedicated sidebar terminal.',
    'start-terminal': 'Start Terminal',
    'stop-terminal': 'Stop Terminal',
    'stop-terminal-confirm': 'Are you sure you want to stop the current terminal session?',
    'add-context': 'Insert current document',
    'proxy-label': 'Proxy:',
    'proxy-placeholder': 'eg. http://127.0.0.1:7890',
    'custom-command-add': 'Add custom command',
    'custom-command-edit': 'Edit command',
    'custom-command-title-input': 'Enter a button title',
    'custom-command-input': 'Enter a shell command',
    'custom-command-remove': 'Remove command',
    'custom-command-manage': 'Manage',
    'custom-command-done': 'Done',
    'custom-command-drag': 'Drag to reorder',
    'close': 'Close',
    'panel-mode-floating': 'Floating',
    'panel-mode-maximized': 'Maximized',
    'panel-mode-embedded': 'Embed in Right Panel',
    'opencode-incompatible': 'Sidebar Terminal is incompatible with OpenCode extension (%s). Please upgrade OpenCode to %s.',
  },
  'zh-CN': {
    'terminal': '侧栏终端',
    'open-terminal': '打开侧栏终端面板',
    'terminal-panel': '侧栏终端',
    'terminal-description': '在独立侧栏终端中运行 Shell 命令。',
    'start-terminal': '启动终端',
    'stop-terminal': '停止终端',
    'stop-terminal-confirm': '确定要停止当前终端会话吗？',
    'add-context': '插入当前文档',
    'proxy-label': '代理：',
    'proxy-placeholder': 'eg. http://127.0.0.1:7890',
    'custom-command-add': '添加自定义命令',
    'custom-command-edit': '编辑命令',
    'custom-command-title-input': '输入按钮标题',
    'custom-command-input': '输入一条 Shell 命令',
    'custom-command-remove': '删除命令',
    'custom-command-manage': '管理',
    'custom-command-done': '完成',
    'custom-command-drag': '拖动排序',
    'close': '关闭',
    'panel-mode-floating': '浮动窗口',
    'panel-mode-maximized': '最大化',
    'panel-mode-embedded': '嵌入右侧面板',
    'opencode-incompatible': '侧栏终端与当前 OpenCode 扩展（%s）不兼容，请升级 OpenCode 到 %s。',
  }
})

export function ensureOpenCodeCompatible () {
  const version = ctx.getExtensionLoadStatus(openCodeExtensionId)?.version

  if (!version) {
    return true
  }

  if (ctx.lib.semver.satisfies(version, requiredOpenCodeVersion)) {
    return true
  }

  ctx.ui.useToast().show(
    'warning',
    i18n.t('opencode-incompatible', version, requiredOpenCodeVersion),
    5000
  )
  return false
}
