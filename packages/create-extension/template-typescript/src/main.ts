import { registerPlugin } from '@yank-note/runtime-api'
import HelloWorld from '@/components/HelloWorld.vue'
import i18n from './i18n'

import './style.css'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    ctx.ui.useToast().show('info', i18n.t('helloworld'))

    ctx.statusBar.tapMenus(menus => {
      menus[extensionName] = {
        id: extensionName,
        position: 'left',
        title: i18n.t('helloworld'),
        onClick: () => {
          ctx.ui.useModal().alert({
            component: HelloWorld
          })
        }
      }
    })
  }
})
