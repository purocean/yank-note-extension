import { registerPlugin } from '@yank-note/runtime-api'
import { present, i18n } from './helper'
import RevealPreviewer from './RevealPreviewer.vue'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    ctx.statusBar.tapMenus(menus => {
      menus['status-bar-tool']?.list?.push(
        { type: 'separator', order: 999 },
        {
          id: extensionId + '-present',
          type: 'normal',
          title: i18n.t('present'),
          onClick: () => present(),
          order: 999,
        },
        {
          id: extensionId + '-print',
          type: 'normal',
          title: i18n.t('print'),
          onClick: () => present(true),
          order: 999,
        }
      )
    })

    ctx.view.registerPreviewer({
      name: 'Reveal.js',
      component: RevealPreviewer,
    })
  }
})
