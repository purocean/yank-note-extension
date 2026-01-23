/* eslint-disable quote-props */
import { ctx } from '@yank-note/runtime-api'
import { ref, shallowRef, type Ref, type ShallowRef, type App } from 'vue'

export interface UpdatePayload {
  terminalReady: boolean
  actions: ActionButton[]
}

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

export const extensionId = __EXTENSION_ID__
export const proxyStorageKey = extensionId + '.proxy-url'
export const panelModeStorageKey = extensionId + '.panel-mode'

// Panel mode: floating, maximized, embedded
export type PanelMode = 'floating' | 'maximized' | 'embedded'

// Shared panel state
export const panelMode: Ref<PanelMode> = ref(ctx.storage.get(panelModeStorageKey, 'embedded') as PanelMode)

// Shared container element and app instance
export const containerElement: ShallowRef<HTMLElement | null> = shallowRef(null)
export const containerApp: ShallowRef<App | null> = shallowRef(null)
export const containerInstance: ShallowRef<{ focus: () => void, fitXterm: () => void } | null> = shallowRef(null)

// Shared actions state from OpenCodeContainer
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

export const containerActions: ShallowRef<ActionButton[]> = shallowRef([])

// Target containers for different modes
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
    // Fit terminal after moving
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
    'opencode': 'OpenCode',
    'open-opencode': 'Open OpenCode Panel',
    'opencode-panel': 'OpenCode',
    'opencode-description': 'Use OpenCode AI to intelligently process documentation',
    'start-opencode': 'Start OpenCode',
    'stop-opencode': 'Stop OpenCode',
    'stop-opencode-confirm': 'Are you sure you want to stop the current OpenCode instance?',
    'restart-opencode': 'Restart OpenCode',
    'restart-opencode-confirm': 'Current repository has changed. Restart OpenCode instance to use the new location?',
    'repo-mismatch': 'Repository changed, click to restart instance',
    'add-context': 'Add current file as context',
    'context-added': 'Context added successfully',
    'visit-docs': 'Visit Documentation',
    'open-in-browser': 'Open in Browser',
    'proxy-label': 'Proxy:',
    'proxy-placeholder': 'eg. http://127.0.0.1:7890',
    'backup-warning': 'Please ensure version control and backup before use',
    'close': 'Close',
    'panel-mode-floating': 'Floating',
    'panel-mode-maximized': 'Maximized',
    'panel-mode-embedded': 'Embed in Right Panel',
  },
  'zh-CN': {
    'opencode': 'OpenCode',
    'open-opencode': '打开 OpenCode 面板',
    'opencode-panel': 'OpenCode',
    'opencode-description': '使用 OpenCode 智能处理文档',
    'start-opencode': '启动 OpenCode',
    'stop-opencode': '停止 OpenCode',
    'stop-opencode-confirm': '确定要停止当前运行的 OpenCode 实例吗？',
    'restart-opencode': '重启 OpenCode',
    'restart-opencode-confirm': '当前仓库已变更，是否重启 OpenCode 实例以使用新位置？',
    'repo-mismatch': '实例仓库已变更，点击重启实例',
    'add-context': '添加当前文件为上下文',
    'context-added': '上下文添加成功',
    'visit-docs': '访问文档',
    'open-in-browser': '在浏览器中打开',
    'proxy-label': '代理：',
    'proxy-placeholder': 'eg. http://127.0.0.1:7890',
    'backup-warning': '使用前请做好文档版本管理和备份',
    'close': '关闭',
    'panel-mode-floating': '浮动窗口',
    'panel-mode-maximized': '最大化',
    'panel-mode-embedded': '嵌入右侧面板',
  }
})
