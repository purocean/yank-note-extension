import { registerPlugin } from '@yank-note/runtime-api'
import { ChangeGutterController } from './controller'
import { changeGutterStyles } from './styles'
import type { ChangeGutterLabels } from './types'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    if (ctx.args.MODE !== 'normal') {
      return
    }

    const i18n = ctx.i18n.createI18n({
      en: {
        gitAdded: 'Git · Added compared with HEAD',
        gitModified: 'Git · Modified compared with HEAD',
        gitDeleted: 'Git · Deleted compared with HEAD',
        tabAdded: 'Tab · Added since this tab was opened',
        tabModified: 'Tab · Modified since this tab was opened',
        tabDeleted: 'Tab · Deleted since this tab was opened',
        manualAdded: 'Baseline · Added compared with the selected baseline',
        manualModified: 'Baseline · Modified compared with the selected baseline',
        manualDeleted: 'Baseline · Deleted compared with the selected baseline',
        gitPreview: 'Changes compared with HEAD',
        tabPreview: 'Changes since this tab was opened',
        manualPreview: 'Changes compared with the selected baseline',
        setBaseline: 'Clear All Markers',
        setBaselineTitle: 'Clear all markers: restart change tracking from the current content and stop Git checks for this tab',
        refreshBaseline: 'Refresh Baseline',
        refreshBaselineTitle: 'Refresh baseline: reload the Git or tab baseline and recalculate markers',
        restore: 'Restore Change',
        history: 'Document History',
        wordWrap: 'Wrap',
        close: 'Close',
        truncated: 'Preview truncated',
      },
      'zh-CN': {
        gitAdded: 'Git · 相对 HEAD 新增',
        gitModified: 'Git · 相对 HEAD 修改',
        gitDeleted: 'Git · 相对 HEAD 删除',
        tabAdded: 'Tab · 相对打开时新增',
        tabModified: 'Tab · 相对打开时修改',
        tabDeleted: 'Tab · 相对打开时删除',
        manualAdded: '基线 · 相对手动基线新增',
        manualModified: '基线 · 相对手动基线修改',
        manualDeleted: '基线 · 相对手动基线删除',
        gitPreview: '相对 HEAD 的变更',
        tabPreview: '相对 Tab 打开时的变更',
        manualPreview: '相对手动基线的变更',
        setBaseline: '清除全部标记',
        setBaselineTitle: '清除全部标记：从当前内容重新记录变更，并停止此 Tab 的 Git 检查',
        refreshBaseline: '重新计算基线',
        refreshBaselineTitle: '重新计算基线：重新获取 Git 或 Tab 基线并计算变更标记',
        restore: '还原此变更',
        history: '文档历史',
        wordWrap: '自动换行',
        close: '关闭',
        truncated: '预览已截断',
      },
      'zh-TW': {
        gitAdded: 'Git · 相對 HEAD 新增',
        gitModified: 'Git · 相對 HEAD 修改',
        gitDeleted: 'Git · 相對 HEAD 刪除',
        tabAdded: 'Tab · 相對開啟時新增',
        tabModified: 'Tab · 相對開啟時修改',
        tabDeleted: 'Tab · 相對開啟時刪除',
        manualAdded: '基線 · 相對手動基線新增',
        manualModified: '基線 · 相對手動基線修改',
        manualDeleted: '基線 · 相對手動基線刪除',
        gitPreview: '相對 HEAD 的變更',
        tabPreview: '相對 Tab 開啟時的變更',
        manualPreview: '相對手動基線的變更',
        setBaseline: '清除全部標記',
        setBaselineTitle: '清除全部標記：從目前內容重新記錄變更，並停止此 Tab 的 Git 檢查',
        refreshBaseline: '重新計算基線',
        refreshBaselineTitle: '重新計算基線：重新取得 Git 或 Tab 基線並計算變更標記',
        restore: '還原此變更',
        history: '文件歷史',
        wordWrap: '自動換行',
        close: '關閉',
        truncated: '預覽已截斷',
      },
    })

    const getLabels = (): ChangeGutterLabels => ({
      decorations: {
        git: {
          added: i18n.t('gitAdded'),
          modified: i18n.t('gitModified'),
          deleted: i18n.t('gitDeleted'),
        },
        tab: {
          added: i18n.t('tabAdded'),
          modified: i18n.t('tabModified'),
          deleted: i18n.t('tabDeleted'),
        },
        manual: {
          added: i18n.t('manualAdded'),
          modified: i18n.t('manualModified'),
          deleted: i18n.t('manualDeleted'),
        },
      },
      preview: {
        sourceTitles: {
          git: i18n.t('gitPreview'),
          tab: i18n.t('tabPreview'),
          manual: i18n.t('manualPreview'),
        },
        setBaseline: i18n.t('setBaseline'),
        setBaselineTitle: i18n.t('setBaselineTitle'),
        refreshBaseline: i18n.t('refreshBaseline'),
        refreshBaselineTitle: i18n.t('refreshBaselineTitle'),
        restore: i18n.t('restore'),
        history: i18n.t('history'),
        wordWrap: i18n.t('wordWrap'),
        close: i18n.t('close'),
        truncated: i18n.t('truncated'),
      },
    })

    ctx.theme.addStyles(changeGutterStyles)
    const controller = new ChangeGutterController(ctx, getLabels)

    ctx.registerHook('I18N_CHANGE_LANGUAGE', () => controller.refreshLabels())

    controller.start().catch(error => {
      ctx.utils.getLogger('extension:change-gutter').error(error)
    })
  }
})
