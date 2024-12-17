import { ctx } from '@yank-note/runtime-api'

export const i18n = ctx.i18n.createI18n({
  en: {
    'graph-view': 'Document Graph View',
    'open-graph-view': 'Open Document Graph View',
    'graph-view-of': 'Document Graph View of "%s"',
  },
  'zh-CN': {
    'graph-view': '文档关系图',
    'open-graph-view': '显示文档关系图',
    'graph-view-of': '"%s" 的文档关系图',
  }
})
