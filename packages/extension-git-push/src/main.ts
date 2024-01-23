import { registerPlugin } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    const i18n = ctx.i18n.createI18n({
      en: {
        'git-push': 'Git Push',
        'git-pull': 'Git Pull',
        'not-support': 'Yank Note downloaded from the Mac Apple Store does not support this extension.'
      },
      'zh-CN': {
        'git-push': 'Git 推送',
        'git-pull': 'Git 拉取',
        'not-support': '从 Mac Apple Store 中下载的应用不支持此拓展。'
      }
    })

    async function doAction (xcmd) {
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
        let cmd = `pushd "${path}" && ${xcmd}`

        if (!ctx.store.state.showXterm) {
          cmd += ' && exit'
        }

        ctx.action.getActionHandler('xterm.run')(cmd)
      }
    }

    function gitPush () {
      doAction('git add . && git commit -m update && git push')
    }

    function gitPull () {
      doAction('git pull')
    }

    ctx.action.registerAction({
      name: extensionId + '.push',
      description: i18n.t('git-push'),
      forUser: true,
      handler: gitPush,
    })

    ctx.action.registerAction({
      name: extensionId + '.pull',
      description: i18n.t('git-pull'),
      forUser: true,
      handler: gitPull,
    })

    const { h } = ctx.lib.vue

    ctx.statusBar.tapMenus(menus => {
      menus[extensionId] = {
        id: extensionId,
        position: 'left',
        title: h('div', { class: 'extension-git-push-menu' }, [
          h('span', { style: 'padding-left: 4px;', onClick: gitPush, title: i18n.t('git-push') }, [
            'Git',
            h(ctx.components.SvgIcon, { width: '11px', name: 'arrow-left-solid', style: 'transform: rotate(90deg)' })
          ]),
          h('span', { style: 'padding-right: 2px;', onClick: gitPull, title: i18n.t('git-pull') }, [
            h(ctx.components.SvgIcon, { width: '11px', name: 'arrow-left-solid', style: 'transform: rotate(-90deg)' })
          ])
        ]),
      }
    })

    ctx.theme.addStyles(`
      .custom-title[data-id="@yank-note/extension-git-push"]:hover {
        background: unset;
      }

      .extension-git-push-menu,
      .extension-git-push-menu > span {
        display: flex;
        align-items: center;
      }

      .extension-git-push-menu > span {
        cursor: pointer;
      }

      .extension-git-push-menu > span > .svg-icon {
        margin: 0 2px;
      }

      .extension-git-push-menu > span:hover  {
        background: rgba(255, 255, 255, 0.1);
      }
    `)
  }
})
