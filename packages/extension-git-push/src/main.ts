import { registerPlugin } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    const i18n = ctx.i18n.createI18n({
      en: {
        'git-push': 'Git Push',
        'not-support': 'Yank Note downloaded from the Mac Apple Store does not support this extension.'
      },
      'zh-CN': {
        'git-push': 'Git 推送',
        'not-support': '从 Mac Apple Store 中下载的应用不支持此拓展。'
      }
    })

    ctx.statusBar.tapMenus(menus => {
      menus[extensionId] = {
        id: extensionId,
        position: 'left',
        title: i18n.t('git-push'),
        onClick: async () => {
          if (ctx.args.FLAG_MAS) {
            if (await ctx.ui.useModal().confirm({
              content: i18n.t('not-support'),
            })) {
              window.open('https://github.com/purocean/yn/issues/65#issuecomment-1065799677')
            }
            return
          }

          const currentRepo = ctx.store.state.currentRepo
          const path = currentRepo && currentRepo.path
          if (path) {
            let cmd = `cd '${path}' && git add . && git ci -m 'update' && git push`

            if (!ctx.store.state.showXterm) {
              cmd += ' && exit'
            }

            ctx.action.getActionHandler('xterm.run')(cmd)
          }
        }
      }
    })
  }
})
