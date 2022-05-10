import { Ctx, registerPlugin } from '@yank-note/runtime-api'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    ctx.i18n.mergeLanguage('en', {
      [extensionName]: {
        'popup-preview': 'Popup Preview',
      },
    })

    ctx.i18n.mergeLanguage('zh-CN', {
      [extensionName]: {
        'popup-preview': '弹窗预览',
      },
    })

    let _win: any = null

    function getWin () {
      if (_win && _win.window) {
        return _win.window
      } else {
        _win = null
        return null
      }
    }

    ctx.statusBar.tapMenus(menus => {
      menus['status-bar-tool']?.list?.push({
        id: extensionName,
        type: 'normal',
        title: ctx.i18n.t(`${extensionName}.popup-preview`),
        onClick: () => {
          if (getWin()) {
            try {
              getWin().close()
            } catch {
              // do nothing
            }
          }

          const url = new URL(location.origin)
          url.searchParams.set('mode', 'share-preview')
          _win = ctx.env.openWindow(url.toString(), '_blank', { alwaysOnTop: false })
          ctx.layout.toggleView(false)

          if (_win) {
            _win.opener = null
            _win.parent = null
            _win.fetch = (...args: any[]) => {
              if (args[1]?.method?.toUpperCase() === 'POST') {
                throw new Error('[PopupPreview] POST request is not supported')
              }

              return fetch.apply(_win.window, args)
            }

            _win.window.addEventListener('load', () => {
              setTimeout(updateContent, 0)
              setTimeout(updateCurrentFile, 0)
              setTimeout(updateCurrentRepo, 0)
            })
          } else {
            console.error('open popup preview window failed')
          }
        }
      })
    })

    function updateContent () {
      const win = getWin()
      if (win && win.ctx) {
        const _ctx: Ctx = win.ctx
        _ctx.store.state.currentContent = ctx.store.state.currentContent
        win.document.title = ctx.i18n.t(`${extensionName}.popup-preview`)
      }
    }

    function updateViewScroll (line: number) {
      const win = getWin()
      if (win && win.ctx) {
        const _ctx: Ctx = win.ctx
        _ctx.view.revealLine(line)
      }
    }

    function updateCurrentFile () {
      const win = getWin()
      if (win && win.ctx) {
        const _ctx: Ctx = win.ctx
        _ctx.store.commit('setCurrentFile', JSON.parse(JSON.stringify(ctx.store.state.currentFile)))
      }
    }

    function updateCurrentRepo () {
      const win = getWin()
      if (win && win.ctx) {
        const _ctx: Ctx = win.ctx
        _ctx.store.commit('setCurrentRepo', JSON.parse(JSON.stringify(ctx.store.state.currentRepo)))
      }
    }

    ctx.lib.vue.watch(() => ctx.store.state.currentContent, updateContent)
    ctx.lib.vue.watch(() => ctx.store.state.currentRepo, updateCurrentRepo)
    ctx.lib.vue.watch(() => ctx.store.state.currentFile, updateCurrentFile)
    ctx.editor.whenEditorReady().then(({ editor }) => {
      editor.onDidScrollChange(() => {
        const visibleRange = editor.getVisibleRanges()[0]
        const startLine = Math.max(1, visibleRange.startLineNumber - 1)
        updateViewScroll(startLine)
      })
    })
  }
})
