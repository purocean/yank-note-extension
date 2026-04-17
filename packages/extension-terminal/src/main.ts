import { registerPlugin } from './runtime-api'
import { createApp, nextTick, ref, watchEffect } from 'vue'
import TerminalContainer from './TerminalContainer.vue'
import TerminalPanel from './TerminalPanel.vue'
import TerminalRightPanel from './TerminalRightPanel.vue'
import { i18n, panelMode, cyclePanelMode, containerElement, containerApp, containerInstance, containerActions, moveContainerToTarget, type UpdatePayload } from './lib'

const extensionId = __EXTENSION_ID__
const rightPanelName = extensionId + '.terminal-right-panel'

registerPlugin({
  name: extensionId,
  register: ctx => {
    const openTerminalActionName = extensionId + '.open-terminal'
    let panelContainer: HTMLElement | null = null
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
        },
      })

      ctx.directives.default(app as any)
      app.mount(el)
      containerApp.value = app
    }

    function buildRightPanel (actions: typeof containerActions.value) {
      const launcherIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M0 80c0-26.5 21.5-48 48-48l480 0c26.5 0 48 21.5 48 48l0 272c0 26.5-21.5 48-48 48l-176 0 0 64 80 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L144 496c-8.8 0-16-7.2-16-16s7.2-16 16-16l80 0 0-64L48 400c-26.5 0-48-21.5-48-48L0 80zm56 24l0 224 464 0 0-224L56 104zm49 37.7c6.2-6.2 16.4-6.2 22.6 0l80 80c6.2 6.2 6.2 16.4 0 22.6l-80 80c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6L173.4 232 105 163.7c-6.2-6.2-6.2-16.4 0-22.6zM240 288l96 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-96 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>'
      const stopIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/></svg>'
      const cycleModeIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M200 288H88c-21.4 0-32.1 25.8-17 41l32.9 31-99.2 99.3c-6.2 6.2-6.2 16.4 0 22.6l25.4 25.4c6.2 6.2 16.4 6.2 22.6 0L152 408l31.1 33c15.1 15.1 40.9 4.4 40.9-17V312c0-13.3-10.7-24-24-24zm112-64h112c21.4 0 32.1-25.9 17-41l-33-31 99.3-99.3c6.2-6.2 6.2-16.4 0-22.6L481.9 4.7c-6.2-6.2-16.4-6.2-22.6 0L360 104l-31.1-33C313.8 55.9 288 66.6 288 88v112c0 13.3 10.7 24 24 24zm96 136l33-31.1c15.1-15.1 4.4-40.9-17-40.9H312c-13.3 0-24 10.7-24 24v112c0 21.4 25.9 32.1 41 17l31-32.9 99.3 99.3c6.2 6.2 16.4 6.2 22.6 0l25.4-25.4c6.2-6.2 6.2-16.4 0-22.6L408 360zM183 71.1L152 104 52.7 4.7c-6.2-6.2-16.4-6.2-22.6 0L4.7 30.1c-6.2 6.2-6.2 16.4 0 22.6L104 152l-33 31.1C55.9 198.2 66.6 224 88 224h112c13.3 0 24-10.7 24-24V88c0-21.3-25.9-32-41-16.9z"/></svg>'

      const rightPanelActionBtns: Array<Record<string, any>> = [
        {
          type: 'normal' as const,
          key: 'open-launcher',
          order: 100,
          icon: launcherIcon,
          title: i18n.t('show-welcome'),
          onClick: () => containerInstance.value?.showWelcome(),
        },
        {
          type: 'normal' as const,
          key: 'cycle-panel-mode',
          order: 1000,
          icon: cycleModeIcon,
          title: i18n.t('panel-mode-floating'),
          onClick: () => cyclePanelMode(),
        },
      ]

      const stopAction = actions.find(action => action.key === 'stop')
      if (stopAction) {
        rightPanelActionBtns.unshift({
          type: 'normal' as const,
          key: 'stop',
          order: 90,
          icon: stopIcon,
          title: stopAction.title,
          onClick: () => stopAction.handler(),
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

    watchEffect(() => {
      const mode = panelMode.value
      const actions = containerActions.value

      if (mode === 'embedded' && visible.value) {
        ctx.workbench.ContentRightSide.registerPanel(buildRightPanel(actions), true)
        ctx.workbench.ContentRightSide.show(rightPanelName)
      } else {
        ctx.workbench.ContentRightSide.removePanel(rightPanelName)
      }

      nextTick(() => {
        containerInstance.value?.focus()
        containerInstance.value?.fitXterm()
      })
    })

    ctx.action.registerAction({
      name: openTerminalActionName,
      description: i18n.t('open-terminal'),
      forUser: true,
      when,
      handler: () => {
        ensureContainerCreated()

        if (panelContainer) {
          visible.value = true
          if (panelMode.value === 'embedded') {
            ctx.workbench.ContentRightSide.registerPanel(buildRightPanel(containerActions.value), true)
            ctx.workbench.ContentRightSide.show(rightPanelName)
          } else {
            (panelContainer.children[0] as any)?.bump?.()
          }
          nextTick(() => moveContainerToTarget())
          return
        }

        panelContainer = document.createElement('div')
        panelContainer.id = 'terminal-panel-container'
        document.body.appendChild(panelContainer)
        visible.value = true

        if (panelMode.value === 'embedded') {
          ctx.workbench.ContentRightSide.show(rightPanelName)
        }

        const app = createApp(TerminalPanel, {
          visible,
          'onUpdate:visible': (val: boolean) => { visible.value = val },
          'onUpdate:panelMode': (mode: string) => {
            if (mode === 'embedded') {
              ctx.workbench.ContentRightSide.show(rightPanelName)
            }
          },
        })

        ctx.directives.default(app as any)
        app.mount(panelContainer)

        nextTick(() => moveContainerToTarget())
      },
    })

    ctx.workbench.FileTabs.tapActionBtns(btns => {
      if (!when()) {
        return
      }

      const idx = btns.findIndex(x => x.type === 'normal' && x.key === 'plugin.view-links.view-document-links')
      const insertAt = idx >= 0 ? idx : btns.length
      const baseIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M0 80c0-26.5 21.5-48 48-48l480 0c26.5 0 48 21.5 48 48l0 272c0 26.5-21.5 48-48 48l-176 0 0 64 80 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L144 496c-8.8 0-16-7.2-16-16s7.2-16 16-16l80 0 0-64L48 400c-26.5 0-48-21.5-48-48L0 80zm56 24l0 224 464 0 0-224L56 104zm49 37.7c6.2-6.2 16.4-6.2 22.6 0l80 80c6.2 6.2 6.2 16.4 0 22.6l-80 80c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6L173.4 232 105 163.7c-6.2-6.2-6.2-16.4 0-22.6zM240 288l96 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-96 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>'
      const runningIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M0 80c0-26.5 21.5-48 48-48l480 0c26.5 0 48 21.5 48 48l0 272c0 26.5-21.5 48-48 48l-176 0 0 64 80 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L144 496c-8.8 0-16-7.2-16-16s7.2-16 16-16l80 0 0-64L48 400c-26.5 0-48-21.5-48-48L0 80zm56 24l0 224 464 0 0-224L56 104zm49 37.7c6.2-6.2 16.4-6.2 22.6 0l80 80c6.2 6.2 6.2 16.4 0 22.6l-80 80c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6L173.4 232 105 163.7c-6.2-6.2-6.2-16.4 0-22.6zM240 288l96 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-96 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/><circle cx="488" cy="88" r="56" fill="#22c55e"/></svg>'

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
  },
})
