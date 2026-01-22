import { registerPlugin } from '@yank-note/runtime-api'
import OpenCodePanel from './OpenCodePanel.vue'
import OpenCodeRightPanel from './OpenCodeRightPanel.vue'
import OpenCodeContainer from './OpenCodeContainer.vue'
import { i18n, panelMode, cyclePanelMode, containerElement, containerApp, containerInstance, containerActions, moveContainerToTarget } from './lib'
import { createApp, ref, nextTick, watchEffect, h } from 'vue'
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
        onUpdate: (payload: UpdatePayload) => {
          // Update shared actions state
          containerActions.value = payload.actions
        },
        'onUpdate:running': (val: boolean) => {
          running.value = val
          ctx.workbench.FileTabs.refreshActionBtns()
        },
        onRef: (instance: any) => {
          containerInstance.value = instance
        }
      })

      ctx.directives.default(app as any)
      app.mount(el)
      containerApp.value = app
    }

    function buildRightPanel (actions: typeof containerActions.value) {
      // SVG icons
      const cycleModeIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M200 288H88c-21.4 0-32.1 25.8-17 41l32.9 31-99.2 99.3c-6.2 6.2-6.2 16.4 0 22.6l25.4 25.4c6.2 6.2 16.4 6.2 22.6 0L152 408l31.1 33c15.1 15.1 40.9 4.4 40.9-17V312c0-13.3-10.7-24-24-24zm112-64h112c21.4 0 32.1-25.9 17-41l-33-31 99.3-99.3c6.2-6.2 6.2-16.4 0-22.6L481.9 4.7c-6.2-6.2-16.4-6.2-22.6 0L360 104l-31.1-33C313.8 55.9 288 66.6 288 88v112c0 13.3 10.7 24 24 24zm96 136l33-31.1c15.1-15.1 4.4-40.9-17-40.9H312c-13.3 0-24 10.7-24 24v112c0 21.4 25.9 32.1 41 17l31-32.9 99.3 99.3c6.2 6.2 16.4 6.2 22.6 0l25.4-25.4c6.2-6.2 6.2-16.4 0-22.6L408 360zM183 71.1L152 104 52.7 4.7c-6.2-6.2-16.4-6.2-22.6 0L4.7 30.1c-6.2 6.2-6.2 16.4 0 22.6L104 152l-33 31.1C55.9 198.2 66.6 224 88 224h112c13.3 0 24-10.7 24-24V88c0-21.3-25.9-32-41-16.9z"/></svg>'
      const stopIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/></svg>'
      const openBrowserIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M352 0c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9L370.7 96 201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L416 141.3l41.4 41.4c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V32c0-17.7-14.3-32-32-32H352zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/></svg>'
      const addContextIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>'

      // Action buttons for right side panel using custom type with Vue render
      const rightPanelActionBtns: any[] = [
        {
          type: 'normal' as const,
          key: 'cycle-panel-mode',
          order: 1000,
          icon: cycleModeIcon,
          title: i18n.t('panel-mode-floating'),
          onClick: () => cyclePanelMode(),
        },
      ]

      // Add action buttons from container
      const stopAction = actions.find(a => a.key === 'stop')
      const openBrowserAction = actions.find(a => a.key === 'open-browser')
      const restartAction = actions.find(a => a.key === 'restart')
      const addContextAction = actions.find(a => a.key === 'add-context')

      if (stopAction) {
        rightPanelActionBtns.unshift({
          type: 'normal' as const,
          key: 'stop',
          order: 100,
          icon: stopIcon,
          title: stopAction.title,
          onClick: () => stopAction.handler(),
        })
      }

      if (openBrowserAction) {
        rightPanelActionBtns.unshift({
          type: 'normal' as const,
          key: 'open-browser',
          order: 100,
          icon: openBrowserIcon,
          title: openBrowserAction.title,
          onClick: () => openBrowserAction.handler(),
        })
      }

      if (restartAction) {
        rightPanelActionBtns.unshift({
          type: 'custom' as const,
          key: 'restart',
          order: 100,
          component: () => h('div', {
            class: 'action-btn restart-btn',
            title: restartAction.title,
            onClick: () => restartAction.handler(),
            style: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', borderRadius: '4px', padding: '0 4px', color: 'rgba(230, 126, 34, 0.85)' }
          }, [
            h('span', { class: 'restart-hint', style: { fontSize: '10px' } }, restartAction.meta?.hint || '')
          ]),
        })
      }

      if (addContextAction) {
        const displayText = addContextAction.meta?.displayFileName
          ? addContextAction.meta.displayFileName + (addContextAction.meta.selectionLines ? '#' + addContextAction.meta.selectionLines : '')
          : ''
        rightPanelActionBtns.unshift({
          type: 'custom' as const,
          key: 'add-context',
          order: 100,
          component: () => h('div', {
            class: 'action-btn context-btn',
            title: addContextAction.title,
            onClick: () => addContextAction.handler(),
            style: { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', width: 'fit-content', borderRadius: '4px', padding: '0 4px' }
          }, [
            h('span', { innerHTML: addContextIcon, style: { display: 'flex', width: '10px', height: '10px' } }),
            h('span', { class: 'context-info', style: { fontSize: '10px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--g-color-20)' } }, displayText),
          ]),
        })
      }

      return {
        name: rightPanelName,
        displayName: i18n.t('opencode-panel'),
        order: 100,
        keepAlive: false,
        component: OpenCodeRightPanel,
        actionBtns: rightPanelActionBtns,
      }
    }

    // Watch panel mode changes to show/hide right panel
    watchEffect(() => {
      const mode = panelMode.value
      const actions = containerActions.value

      if (mode === 'embedded' && visible.value) {
        // Register right side panel
        ;(ctx.workbench as any).ContentRightSide.registerPanel(buildRightPanel(actions), true)
        ;(ctx.workbench as any).ContentRightSide.show(rightPanelName)
      } else {
        // Remove from right panel when not in embedded mode
        ;(ctx.workbench as any).ContentRightSide.removePanel(rightPanelName)
      }

      // Fit terminal after mode change
      nextTick(() => {
        containerInstance.value?.focus()
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
            ;(ctx.workbench as any).ContentRightSide.registerPanel(buildRightPanel(containerActions.value), true)
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
