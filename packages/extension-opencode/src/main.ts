import { registerPlugin } from '@yank-note/runtime-api'
import OpenCodePanel from './OpenCodePanel.vue'
import OpenCodeRightPanel from './OpenCodeRightPanel.vue'
import OpenCodeContainer from './OpenCodeContainer.vue'
import { i18n, panelMode, cyclePanelMode, containerElement, containerApp, containerInstance, containerActions, moveContainerToTarget } from './lib'
import { createApp, ref, watch, markRaw, nextTick } from 'vue'
import type { UpdatePayload } from './OpenCodeContainer.vue'

const extensionId = __EXTENSION_ID__
const rightPanelName = extensionId + '.opencode-right-panel'

registerPlugin({
  name: extensionId,
  register: ctx => {
    const openOpenCodeActionName = extensionId + '.open-opencode'
    let panelContainer: HTMLElement | null = null
    const visible = ref(false)
    const running = ref(false)

    function when () {
      return !ctx.args.FLAG_DEMO && // not in demo mode
        ctx.args.MODE === 'normal' // in normal mode
    }

    // Create shared OpenCodeContainer instance
    function ensureContainerCreated () {
      if (containerElement.value) return

      const el = document.createElement('div')
      el.id = 'opencode-container-wrapper'
      el.style.width = '100%'
      el.style.height = '100%'
      containerElement.value = el

      const app = createApp(OpenCodeContainer, {
        visible: true,
        onUpdate: (payload: UpdatePayload) => {
          // Update shared actions state
          containerActions.value = payload.actions
        },
        'onUpdate:running': (val: boolean) => {
          running.value = val
          ctx.workbench.FileTabs.refreshActionBtns()
        },
        ref: (instance: any) => {
          containerInstance.value = instance
        }
      })

      ctx.directives.default(app as any)
      app.mount(el)
      containerApp.value = app
    }

    // Action buttons for right side panel
    const cycleModeIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM64 96l0 320 160 0 0-320L64 96zm384 0L288 96l0 320 160 0c8.8 0 16-7.2 16-16l0-288c0-8.8-7.2-16-16-16z"/></svg>'
    const rightPanelActionBtns = [
      {
        type: 'normal' as const,
        key: 'cycle-panel-mode',
        icon: cycleModeIcon,
        title: i18n.t('panel-mode-floating'),
        onClick: () => {
          cyclePanelMode()
        },
      },
    ]

    // Register right side panel
    ;(ctx.workbench as any).ContentRightSide.registerPanel({
      name: rightPanelName,
      displayName: i18n.t('opencode-panel'),
      order: 100,
      keepAlive: true,
      component: markRaw(OpenCodeRightPanel),
      actionBtns: rightPanelActionBtns,
    })

    // Watch panel mode changes to show/hide right panel
    watch(panelMode, (mode) => {
      if (mode === 'embedded' && visible.value) {
        ;(ctx.workbench as any).ContentRightSide.show(rightPanelName)
      } else {
        // Remove from right panel when not in embedded mode
        ;(ctx.workbench as any).ContentRightSide.removePanel(rightPanelName)
        // Re-register for future use
        ;(ctx.workbench as any).ContentRightSide.registerPanel({
          name: rightPanelName,
          displayName: i18n.t('opencode-panel'),
          order: 100,
          keepAlive: true,
          component: markRaw(OpenCodeRightPanel),
          actionBtns: rightPanelActionBtns,
        })
      }
      // Fit terminal after mode change
      nextTick(() => {
        containerInstance.value?.fitXterm()
      })
    })

    ctx.action.registerAction({
      name: openOpenCodeActionName,
      description: i18n.t('open-opencode'),
      forUser: true,
      when,
      handler: () => {
        // Ensure container is created
        ensureContainerCreated()

        if (panelContainer) {
          visible.value = true
          // If embedded mode, show right panel
          if (panelMode.value === 'embedded') {
            ;(ctx.workbench as any).ContentRightSide.show(rightPanelName)
          } else {
            // Bump the panel to the front for floating modes
            ;(panelContainer.children[0] as any)?.bump()
          }
          // Move container to appropriate target
          nextTick(() => moveContainerToTarget())
          return
        }

        panelContainer = document.createElement('div')
        panelContainer.id = 'opencode-panel-container'
        document.body.appendChild(panelContainer)
        visible.value = true

        // If embedded mode, show right panel
        if (panelMode.value === 'embedded') {
          ;(ctx.workbench as any).ContentRightSide.show(rightPanelName)
        }

        const app = createApp(OpenCodePanel, {
          visible,
          'onUpdate:visible': (val: boolean) => { visible.value = val },
          'onUpdate:panelMode': (mode: string) => {
            if (mode === 'embedded') {
              ;(ctx.workbench as any).ContentRightSide.show(rightPanelName)
            }
          }
        })

        ctx.directives.default(app as any)
        app.mount(panelContainer)

        // Move container after panel is mounted
        nextTick(() => moveContainerToTarget())
      },
    })

    ctx.workbench.FileTabs.tapActionBtns(btns => {
      if (when()) {
        const idx = btns.findIndex(x => x.type === 'normal' && x.key === 'plugin.view-links.view-document-links')
        const baseIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="64 64 512 512" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M256.1 312C322.4 312 376.1 258.3 376.1 192C376.1 125.7 322.4 72 256.1 72C189.8 72 136.1 125.7 136.1 192C136.1 258.3 189.8 312 256.1 312zM226.4 368C127.9 368 48.1 447.8 48.1 546.3C48.1 562.7 61.4 576 77.8 576L274.3 576L285.2 521.5C289.5 499.8 300.2 479.9 315.8 464.3L383.1 397C355.1 378.7 321.7 368.1 285.7 368.1L226.3 368.1zM332.3 530.9L320.4 590.5C320.2 591.4 320.1 592.4 320.1 593.4C320.1 601.4 326.6 608 334.7 608C335.7 608 336.6 607.9 337.6 607.7L397.2 595.8C409.6 593.3 421 587.2 429.9 578.3L548.8 459.4L468.8 379.4L349.9 498.3C341 507.2 334.9 518.6 332.4 531zM600.1 407.9C622.2 385.8 622.2 350 600.1 327.9C578 305.8 542.2 305.8 520.1 327.9L491.3 356.7L571.3 436.7L600.1 407.9z"/></svg>'
        const runningIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="64 64 512 512" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M256.1 312C322.4 312 376.1 258.3 376.1 192C376.1 125.7 322.4 72 256.1 72C189.8 72 136.1 125.7 136.1 192C136.1 258.3 189.8 312 256.1 312zM226.4 368C127.9 368 48.1 447.8 48.1 546.3C48.1 562.7 61.4 576 77.8 576L274.3 576L285.2 521.5C289.5 499.8 300.2 479.9 315.8 464.3L383.1 397C355.1 378.7 321.7 368.1 285.7 368.1L226.3 368.1zM332.3 530.9L320.4 590.5C320.2 591.4 320.1 592.4 320.1 593.4C320.1 601.4 326.6 608 334.7 608C335.7 608 336.6 607.9 337.6 607.7L397.2 595.8C409.6 593.3 421 587.2 429.9 578.3L548.8 459.4L468.8 379.4L349.9 498.3C341 507.2 334.9 518.6 332.4 531zM600.1 407.9C622.2 385.8 622.2 350 600.1 327.9C578 305.8 542.2 305.8 520.1 327.9L491.3 356.7L571.3 436.7L600.1 407.9z"/><circle cx="496" cy="140" r="76" fill="#22c55e"/></svg>'
        btns.splice(idx, 0, {
          type: 'normal',
          icon: running.value ? runningIcon : baseIcon,
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
