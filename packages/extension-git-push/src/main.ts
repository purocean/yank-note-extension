import { registerPlugin } from '@yank-note/runtime-api'

const extensionName = 'yank-note-extension-git-push'

registerPlugin({
  name: extensionName,
  register (ctx) {
    ctx.i18n.mergeLanguage('en', {
      [extensionName]: {
        'git-push': 'Git Push',
        'not-support': 'Yank Note downloaded from the Mac Apple Store does not support this extension.'
      },
    })

    ctx.i18n.mergeLanguage('zh-CN', {
      [extensionName]: {
        'git-push': 'Git 推送',
        'not-support': '从 Mac Apple Store 中下载的应用不支持此拓展。'
      },
    })

    ctx.statusBar.tapMenus(menus => {
      menus[extensionName] = {
        id: extensionName,
        position: 'left',
        title: ctx.i18n.t(`${extensionName}.git-push`),
        onClick: async () => {
          if (ctx.args.FLAG_MAS) {
            if (await ctx.ui.useModal().confirm({
              content: ctx.i18n.t(`${extensionName}.not-support`),
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
