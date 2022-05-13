import { ctx } from '@yank-note/runtime-api'

export default ctx.i18n.createI18n({
  en: {
    helloworld: 'HelloWorld',
  },
  'zh-CN': {
    helloworld: '你好世界',
  },
})
