/* eslint-disable quote-props */
import { ctx } from '@yank-note/runtime-api'

export const i18n = ctx.i18n.createI18n({
  en: {
    'graph-view': 'Document Graph View',
    'open-graph-view': 'Open Document Graph View',
    'graph-view-of': 'Document Graph View of "%s"',
    'show-independent-nodes': 'Show Independent Nodes',
    'refresh': 'Refresh',
  },
  'zh-CN': {
    'graph-view': '文档关系图',
    'open-graph-view': '显示文档关系图',
    'graph-view-of': '"%s" 的文档关系图',
    'show-independent-nodes': '显示独立节点',
    'refresh': '刷新',
  }
})
