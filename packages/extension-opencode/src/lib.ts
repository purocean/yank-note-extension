/* eslint-disable quote-props */
import { ctx } from '@yank-note/runtime-api'

export const extensionId = __EXTENSION_ID__
export const proxyStorageKey = extensionId + '.proxy-url'

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
  }
})
