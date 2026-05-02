import { registerPlugin } from '@yank-note/runtime-api'
import { createApp, ref, nextTick, watch, h } from 'vue'
import { Components } from '@yank-note/runtime-api/types/types/renderer/types'
import TerminalPanel from './TerminalPanel.vue'
import TerminalRightPanel from './TerminalRightPanel.vue'
import TerminalContainer from './TerminalContainer.vue'
import { i18n, panelMode, cyclePanelMode, containerElement, containerApp, containerInstance, containerActions, moveContainerToTarget, ensureOpenCodeCompatible, type UpdatePayload } from './lib'

const extensionId = __EXTENSION_ID__
const rightPanelName = extensionId + '.terminal-right-panel'

registerPlugin({
  name: extensionId,
  register: ctx => {
    const openTerminalActionName = extensionId + '.open-terminal'
    let panelContainer: HTMLElement | null = null
    let panelAppMounted = false
    let rightPanelSignature = ''
    const visible = ref(false)
    const running = ref(false)

    function when () {
      return !ctx.args.FLAG_DEMO && ctx.args.MODE === 'normal'
    }

    function ensureContainerCreated () {
      if (containerElement.value) return

      const el = document.createElement('div')
      el.id = 'terminal-container-wrapper'
      el.style.width = '100%'
      el.style.height = '100%'
      containerElement.value = el

      const app = createApp(TerminalContainer, {
        onUpdate: (payload: UpdatePayload) => {
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
      const cycleModeIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M200 288H88c-21.4 0-32.1 25.8-17 41l32.9 31-99.2 99.3c-6.2 6.2-6.2 16.4 0 22.6l25.4 25.4c6.2 6.2 16.4 6.2 22.6 0L152 408l31.1 33c15.1 15.1 40.9 4.4 40.9-17V312c0-13.3-10.7-24-24-24zm112-64h112c21.4 0 32.1-25.9 17-41l-33-31 99.3-99.3c6.2-6.2 6.2-16.4 0-22.6L481.9 4.7c-6.2-6.2-16.4-6.2-22.6 0L360 104l-31.1-33C313.8 55.9 288 66.6 288 88v112c0 13.3 10.7 24 24 24zm96 136l33-31.1c15.1-15.1 4.4-40.9-17-40.9H312c-13.3 0-24 10.7-24 24v112c0 21.4 25.9 32.1 41 17l31-32.9 99.3 99.3c6.2 6.2 16.4 6.2 22.6 0l25.4-25.4c6.2-6.2 6.2-16.4 0-22.6L408 360zM183 71.1L152 104 52.7 4.7c-6.2-6.2-16.4-6.2-22.6 0L4.7 30.1c-6.2 6.2-6.2 16.4 0 22.6L104 152l-33 31.1C55.9 198.2 66.6 224 88 224h112c13.3 0 24-10.7 24-24V88c0-21.3-25.9-32-41-16.9z"/></svg>'
      const addContextIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>'

      const rightPanelActionBtns: Components.RightSidePanel.ActionBtn[] = [
        {
          type: 'normal' as const,
          key: 'cycle-panel-mode',
          order: 1000,
          icon: cycleModeIcon,
          title: i18n.t('panel-mode-floating'),
          onClick: () => cyclePanelMode(),
        },
      ]

      const addContextAction = actions.find(a => a.key === 'add-context')

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
            h('span', { class: 'context-info', style: { fontSize: '12px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--g-color-20)' } }, displayText),
          ]),
        })
      }

      return {
        name: rightPanelName,
        displayName: i18n.t('terminal-panel'),
        order: 100,
        keepAlive: false,
        component: TerminalRightPanel,
        actionBtns: rightPanelActionBtns,
      }
    }

    function focusContainer () {
      nextTick(() => {
        containerInstance.value?.fitXterm()
        containerInstance.value?.focus()
      })
    }

    function getRightPanelSignature (actions: typeof containerActions.value) {
      return JSON.stringify(actions.map(action => ({
        key: action.key,
        title: action.title,
        meta: action.meta,
      })))
    }

    function syncEmbeddedPanel (options?: { show?: boolean }) {
      const actions = containerActions.value
      const panel = buildRightPanel(actions)
      const signature = getRightPanelSignature(actions)
      const exists = ctx.workbench.ContentRightSide.getAllPanels().some(item => item.name === rightPanelName)
      const shouldShow = !!options?.show || (
        ctx.store.state.showContentRightSide &&
        ctx.store.state.currentRightSidePanel === rightPanelName
      )

      if (!exists) {
        ctx.workbench.ContentRightSide.registerPanel(panel)
      } else if (signature !== rightPanelSignature) {
        ctx.workbench.ContentRightSide.registerPanel(panel, true)
      }

      rightPanelSignature = signature

      if (shouldShow) {
        ctx.workbench.ContentRightSide.show(rightPanelName)
      }
    }

    function ensureFloatingPanelCreated () {
      if (panelAppMounted) {
        return
      }

      if (!panelContainer) {
        panelContainer = document.createElement('div')
        panelContainer.id = 'terminal-panel-container'
        document.body.appendChild(panelContainer)
      }

      const app = createApp(TerminalPanel, {
        visible,
        'onUpdate:visible': (val: boolean) => { visible.value = val },
        'onUpdate:panelMode': (mode: string) => {
          if (mode === 'embedded') {
            activateEmbeddedPanel()
          }
        }
      })

      ctx.directives.default(app as any)
      app.mount(panelContainer)
      panelAppMounted = true
    }

    function activateEmbeddedPanel () {
      syncEmbeddedPanel({ show: true })
      nextTick(() => {
        containerInstance.value?.fitXterm()
        containerInstance.value?.focus()
      })
    }

    watch([panelMode, visible, containerActions], ([mode, isVisible]) => {
      if (mode === 'embedded' && isVisible) {
        syncEmbeddedPanel()
      } else {
        ctx.workbench.ContentRightSide.removePanel(rightPanelName)
        rightPanelSignature = ''
      }

      if (mode !== 'embedded' && isVisible) {
        ensureFloatingPanelCreated()
        nextTick(() => {
          moveContainerToTarget()
          focusContainer()
        })
      }
    }, { immediate: true })

    ctx.action.registerAction({
      name: openTerminalActionName,
      description: i18n.t('open-terminal'),
      forUser: true,
      when,
      handler: () => {
        if (!ensureOpenCodeCompatible()) {
          return
        }

        ensureContainerCreated()
        visible.value = true

        if (panelMode.value === 'embedded') {
          activateEmbeddedPanel()
          nextTick(() => {
            moveContainerToTarget()
          })
          return
        }

        ensureFloatingPanelCreated()
        nextTick(() => {
          ;(panelContainer?.children[0] as any)?.bump?.()
          moveContainerToTarget()
          focusContainer()
        })
      },
    })

    ctx.workbench.FileTabs.tapActionBtns(btns => {
      if (!when()) return

      const idx = btns.findIndex(x => x.type === 'normal' && x.key === 'plugin.view-links.view-document-links')
      const insertAt = idx >= 0 ? idx : btns.length
      const baseIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><g transform="translate(-44 -44) scale(1.14)"><path d="M73.4 182.6C60.9 170.1 60.9 149.8 73.4 137.3C85.9 124.8 106.2 124.8 118.7 137.3L278.7 297.3C291.2 309.8 291.2 330.1 278.7 342.6L118.7 502.6C106.2 515.1 85.9 515.1 73.4 502.6C60.9 490.1 60.9 469.8 73.4 457.3L210.7 320L73.4 182.6zM288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"/></g></svg>'
      const runningIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><g transform="translate(-44 -44) scale(1.14)"><path fill="#22c55e" d="M73.4 182.6C60.9 170.1 60.9 149.8 73.4 137.3C85.9 124.8 106.2 124.8 118.7 137.3L278.7 297.3C291.2 309.8 291.2 330.1 278.7 342.6L118.7 502.6C106.2 515.1 85.9 515.1 73.4 502.6C60.9 490.1 60.9 469.8 73.4 457.3L210.7 320L73.4 182.6z"/><path d="M288 448L544 448C561.7 448 576 462.3 576 480C576 497.7 561.7 512 544 512L288 512C270.3 512 256 497.7 256 480C256 462.3 270.3 448 288 448z"/></g></svg>'

      btns.splice(insertAt, 0, {
        type: 'normal',
        icon: running.value ? runningIcon : baseIcon,
        key: openTerminalActionName,
        title: i18n.t('open-terminal') + ' ' + ctx.keybinding.getKeysLabel(openTerminalActionName),
        onClick: () => {
          ctx.action.getActionHandler(openTerminalActionName)()
        },
      })
    })
  }
})

export { UpdatePayload }
