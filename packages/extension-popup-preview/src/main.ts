import { Ctx, registerPlugin } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    const i18n = ctx.i18n.createI18n({
      en: {
        'popup-preview': 'Popup Preview',
      },
      'zh-CN': {
        'popup-preview': '弹窗预览',
      }
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

    function clickScroll (line?: number) {
      if (!line) {
        return
      }

      if (
        ctx.store.state.showEditor &&
        !ctx.store.state.presentation &&
        window.getSelection()!.toString().length < 1
      ) {
        ctx.editor.getEditor().revealLineNearTop(line)
        setTimeout(ctx.editor.highlightLine(line), 1000)
      }

      return false
    }

    ctx.statusBar.tapMenus(menus => {
      menus['status-bar-tool']?.list?.push({
        id: extensionId,
        type: 'normal',
        title: i18n.t('popup-preview'),
        onClick: () => {
          if (!ctx.getPremium()) {
            ctx.ui.useToast().show('info', ctx.i18n.t('premium.need-purchase', extensionId))
            ctx.showPremium()
            throw new Error('Extension requires premium')
          }

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
              setTimeout(() => {
                let clickTimer: number | null = null
                _win.ctx.registerHook('VIEW_ELEMENT_CLICK', async ({ e }) => {
                  if (clickTimer) {
                    clearTimeout(clickTimer)
                    clickTimer = null
                  } else {
                    const target: HTMLElement | null = e.target as HTMLElement
                    const line = parseInt(target?.dataset?.sourceLine || '0', 10)
                    if (line) {
                      clickTimer = setTimeout(() => {
                        _win.ctx.view.disableSyncScrollAwhile(() => {
                          clickScroll(line)
                        })

                        clickTimer = null
                      }, 200) as any
                    }
                  }
                })
              }, 800)
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
        if (_ctx.store.state.currentFile) {
          _ctx.store.state.currentFile.content = ctx.store.state.currentContent
        }
        win.document.title = i18n.t('popup-preview')
      }
    }

    function updateViewScroll (line: number) {
      const win = getWin()
      if (win && win.ctx) {
        const _ctx: Ctx = win.ctx
        if (_ctx.view.getEnableSyncScroll()) {
          _ctx.view.revealLine(line)
        }
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
