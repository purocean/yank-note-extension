// 从应用程序的运行时API中导入registerPlugin函数
import { registerPlugin } from '@yank-note/runtime-api';

// 插件的唯一标识符
const extensionId = __EXTENSION_ID__;

// 使用registerPlugin函数注册插件
registerPlugin({
  // 插件的名称设置为扩展ID
  name: extensionId,

  // register函数会在插件加载时调用
  register(ctx) {
    // 使用应用程序的国际化功能创建一个i18n实例，定义英文和中文的翻译
    const i18n = ctx.i18n.createI18n({
      en: {
        'git-push': 'Git Push',
        'git-pull': 'Git Pull',
        'git-push-with-commit': 'Git Push with Commit',
        'git-pullpush': 'Git pull and push',
        'git-purepush': 'Git just push',
        'not-support': 'Yank Note downloaded from the Mac Apple Store does not support this extension.'
      },
      'zh-CN': {
        'git-push': 'Git 推送(添加和推送)',
        'git-pull': 'Git 拉取',
        'git-push-with-commit': 'Git 推送(自写备注)',
        'git-pullpush': 'Git 拉取并推送',
        'git-purepush': 'Git 推送(单纯推送)',
        'not-support': '从 Mac Apple Store 中下载的应用不支持此拓展。'
      }
    });

    // 定义一个异步函数doAction，用于执行Git命令
    async function doAction(xcmd) {
      // 如果是Mac App Store版本，则显示不支持的提示，并打开指定的网页
      if (ctx.args.FLAG_MAS) {
        if (await ctx.ui.useModal().confirm({
          content: i18n.t('not-support'),
        })) {
          window.open('https://github.com/purocean/yn/issues/65#issuecomment-1065799677');
        }
        return;
      }

      // 获取当前仓库的路径
      const currentRepo = ctx.store.state.currentRepo;
      const path = currentRepo && currentRepo.path;
      if (path) {
        // 构造Git命令字符串
        let cmd = `pushd "${path}" && ${xcmd}`;
        // 如果没有显示Xterm，则在命令后添加exit命令
        if (!ctx.store.state.showXterm) {
          cmd += ' && exit';
        }

        // 执行Git命令
        ctx.action.getActionHandler('xterm.run')(cmd);
      }
    }

    // 定义gitPush函数，用于执行Git推送操作
    function gitPush() {
      doAction('git add . && git commit -m update && git push');
    }

    // 定义gitPull函数，用于执行Git拉取操作
    function gitPull() {
      doAction('git pull');
    }
    function gitPushWithCommit() {
      doAction('git add . && git commit  && git push');
    }
    
    function gitPurePush() {
      doAction('git push');
    }
    
    function gitPullPush() {
      doAction('git pull && git add . && git commit -m update && git push');
    }
    
    // 注册Git推送和拉取的动作
    ctx.action.registerAction({
      name: extensionId + '.push',
      description: i18n.t('git-push'),
      forUser: true,
      handler: gitPush,
    });
    ctx.action.registerAction({
      name: extensionId + '.pull',
      description: i18n.t('git-pull'),
      forUser: true,
      handler: gitPull,
    });
// 添加一个新的动作，绑定到新的gitPushWithCommit函数
    ctx.action.registerAction({
      name: extensionId + '.push-with-commit',
      description: i18n.t('git-push-with-commit'), // 确保i18n中有对应的翻译
      forUser: true,
      handler: gitPushWithCommit,
    });
    ctx.action.registerAction({
      name: extensionId + '.push-purepush',
      description: i18n.t('git-purepush'), // 确保i18n中有对应的翻译
      forUser: true,
      handler: gitPurePush,
    });
    ctx.action.registerAction({
      name: extensionId + '.push-pullpush',
      description: i18n.t('git-pullpush'), // 确保i18n中有对应的翻译
      forUser: true,
      handler: gitPullPush,
    });
    // 使用Vue的createElement函数h来创建UI元素
    const { h } = ctx.lib.vue;

    // 向状态栏添加菜单项
    ctx.statusBar.tapMenus(menus => {
      menus[extensionId] = {
        id: extensionId,
        position: 'left',
        title: h('div', { class: 'extension-git-push-menu' }, [
          // 创建Git推送的菜单项
          h('span', { style: 'padding-left: 4px;', onClick: gitPush, title: i18n.t('git-push') }, [
            'Git推送',
            h(ctx.components.SvgIcon, { width: '11px', name: 'arrow-left-solid', style: 'transform: rotate(90deg)' })
          ]),
          h('span', { style: 'padding-left: 4px;', onClick: gitPushWithCommit, title: i18n.t('git-push-with-commit') }, [
            '自写备注',
            h(ctx.components.SvgIcon, { width: '11px', name: 'arrow-left-solid', style: 'transform: rotate(90deg)' })
          ]),
          h('span', { style: 'padding-left: 4px;', onClick: gitPurePush, title: i18n.t('git-purepush') }, [
            '单纯',
            h(ctx.components.SvgIcon, { width: '11px', name: 'arrow-left-solid', style: 'transform: rotate(90deg)' })
          ]),
          // 创建Git拉取的菜单项
          h('span', { style: 'padding-right: 2px;', onClick: gitPull, title: i18n.t('git-pull') }, [
            '拉取',
            h(ctx.components.SvgIcon, { width: '11px', name: 'arrow-left-solid', style: 'transform: rotate(-90deg)' })
          ]),
          h('span', { style: 'padding-left: 4px;', onClick: gitPullPush, title: i18n.t('git-pullpush') }, [
            '拉取并推送↕'
          ]),
        ]),
      };
    });

    // 添加CSS样式，用于美化插件的UI元素
    ctx.theme.addStyles(`
      /* 鼠标悬停在自定义标题时不改变背景 */
      .custom-title[data-id="@yank-note/extension-git-push"]:hover {
        background: unset;
      }
      /* 定义扩展菜单和子元素的显示方式 */
      .extension-git-push-menu,
      .extension-git-push-menu > span {
        display: flex;
        align-items: center;
      }
      /* 定义扩展菜单子元素的鼠标样式 */
      .extension-git-push-menu > span {
        cursor: pointer;
      }
      /* 定义SVG图标的外边距 */
      .extension-git-push-menu > span > .svg-icon {
        margin: 0 2px;
      }
      /* 定义扩展菜单子元素悬停时的背景色 */
      .extension-git-push-menu > span:hover  {
        background: rgba(255, 255, 255, 0.1);
      }
    `);
  }
});
