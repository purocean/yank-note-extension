import { registerPlugin } from '@yank-note/runtime-api'
import OpenCodePanel from './OpenCodePanel.vue'
import { i18n } from './lib'
import { createApp, ref } from 'vue'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    const openOpenCodeActionName = extensionId + '.open-opencode'
    let container: HTMLElement | null = null
    const visible = ref(false)

    function when () {
      return !ctx.args.FLAG_DEMO && // not in demo mode
        ctx.args.MODE === 'normal' // in normal mode
    }

    ctx.action.registerAction({
      name: openOpenCodeActionName,
      description: i18n.t('open-opencode'),
      forUser: true,
      when,
      handler: () => {
        if (container) {
          visible.value = true
          // Bump the panel to the front
          ;(container.children[0] as any)?.bump()
          return
        }

        container = document.createElement('div')
        container.id = 'opencode-panel-container'
        document.body.appendChild(container)
        visible.value = true
        const app = createApp(OpenCodePanel, {
          visible,
          'onUpdate:visible': (val: boolean) => { visible.value = val }
        })

        ctx.directives.default(app as any)

        app.mount(container)
      },
    })

    ctx.workbench.FileTabs.tapActionBtns(btns => {
      if (when()) {
        const idx = btns.findIndex(x => x.type === 'normal' && x.key === 'plugin.view-links.view-document-links')
        btns.splice(idx, 0, {
          type: 'normal',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="64 64 512 512" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M256.1 312C322.4 312 376.1 258.3 376.1 192C376.1 125.7 322.4 72 256.1 72C189.8 72 136.1 125.7 136.1 192C136.1 258.3 189.8 312 256.1 312zM226.4 368C127.9 368 48.1 447.8 48.1 546.3C48.1 562.7 61.4 576 77.8 576L274.3 576L285.2 521.5C289.5 499.8 300.2 479.9 315.8 464.3L383.1 397C355.1 378.7 321.7 368.1 285.7 368.1L226.3 368.1zM332.3 530.9L320.4 590.5C320.2 591.4 320.1 592.4 320.1 593.4C320.1 601.4 326.6 608 334.7 608C335.7 608 336.6 607.9 337.6 607.7L397.2 595.8C409.6 593.3 421 587.2 429.9 578.3L548.8 459.4L468.8 379.4L349.9 498.3C341 507.2 334.9 518.6 332.4 531zM600.1 407.9C622.2 385.8 622.2 350 600.1 327.9C578 305.8 542.2 305.8 520.1 327.9L491.3 356.7L571.3 436.7L600.1 407.9z"/></svg>',
          key: openOpenCodeActionName,
          title: i18n.t('open-opencode') + ' ' + ctx.keybinding.getKeysLabel(openOpenCodeActionName),
          onClick: () => {
            ctx.action.getActionHandler(openOpenCodeActionName)()
          },
        })
      }
    })
  }
})
