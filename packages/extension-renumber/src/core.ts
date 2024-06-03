/* eslint-disable quote-props */
import { ctx } from '@yank-note/runtime-api'

export const EDIT_ACTION_NAME = __EXTENSION_ID__ + '.edit.trigger'

export const i18n = ctx.i18n.createI18n({
  en: {
    'renumber': 'Renumber',
    'renumber-selected-text': 'Renumber Selected Text',
    'modify': 'Modify',
    'cancel': 'Cancel',
    'accept': 'Accept',
    'discard': 'Discard',
  },
  'zh-CN': {
    'renumber': '重新编号',
    'renumber-selected-text': '重新编号选中文本',
    'modify': '修改',
    'cancel': '取消',
    'accept': '接受',
    'discard': '丢弃',
  },
})
