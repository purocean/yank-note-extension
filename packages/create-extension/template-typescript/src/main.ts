import { registerPlugin } from '@yank-note/runtime-api'
import HelloWorld from '@/components/HelloWorld.vue'

import './style.css'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    ctx.i18n.mergeLanguage('en', {
      [extensionName]: {
        helloworld: 'HelloWorld',
      },
    })

    ctx.i18n.mergeLanguage('zh-CN', {
      [extensionName]: {
        helloworld: '你好世界',
      },
    })

    ctx.ui.useToast().show('info', ctx.i18n.t(`${extensionName}.helloworld`))

    ctx.statusBar.tapMenus(menus => {
      menus[extensionName] = {
        id: extensionName,
        position: 'left',
        title: ctx.i18n.t(`${extensionName}.helloworld`),
        onClick: () => {
          ctx.ui.useModal().alert({
            component: HelloWorld
          })
        }
      }
    })
  }
})
