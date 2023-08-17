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

    const actionName = extensionId + '.push'

    async function doAction () {
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
        let cmd = `pushd "${path}" && git add . && git commit -m update && git push`

        if (!ctx.store.state.showXterm) {
          cmd += ' && exit'
        }

        ctx.action.getActionHandler('xterm.run')(cmd)
      }
    }

    ctx.action.registerAction({
      name: actionName,
      description: i18n.t('git-push'),
      forUser: true,
      handler: doAction,
    })

    ctx.statusBar.tapMenus(menus => {
      menus[actionName] = {
        id: actionName,
        position: 'left',
        title: i18n.t('git-push'),
        onClick: doAction,
      }
    })
  }
})
