import { registerPlugin } from '@yank-note/runtime-api'
import type { Components } from '@yank-note/runtime-api/types/types/renderer/types'

const extensionName = __EXTENSION_ID__

const settingKeySmgPath = 'plugin.sublime-merge.smg-path'

registerPlugin({
  name: extensionName,
  register (ctx) {
    const i18n = ctx.i18n.createI18n({
      en: {
        'open-in-sublime-merge': 'Open in Sublime Merge',
        'show-history-in-sublime-merge': 'Show History in Sublime Merge',
        'smerge-command-path': 'Smerge Command Path',
        'error-tips': 'Please check setting of Sublime Merge command path',
      },
      'zh-CN': {
        'open-in-sublime-merge': '在 Sublime Merge 中打开',
        'show-history-in-sublime-merge': '在 Sublime Merge 中显示历史',
        'smerge-command-path': 'Smerge 命令路径',
        'error-tips': '请检查 Sublime Merge 命令路径设置',
      }
    })

    ctx.setting.changeSchema(schema => {
      if (!schema.groups.some((x: any) => x.value === 'plugin')) {
        schema.groups.push({ value: 'plugin', label: 'Plugin' } as any)
      }

      schema.properties[settingKeySmgPath] = {
        title: i18n.$$t('smerge-command-path'),
        type: 'string',
        defaultValue: 'smerge',
        group: 'plugin',
        required: true,
      }
    })

    const actionName = extensionName + '.open'

    function openInSublimeMerge (node: { repo: string, type: string, path: string }) {
      const currentRepo = ctx.base.getRepo(node.repo)
      const path = currentRepo ? ctx.utils.path.join(currentRepo.path, node.path) : ''
      if (path && currentRepo) {
        const smgPath = ctx.setting.getSetting(settingKeySmgPath, 'smerge')

        const args = [ctx.utils.quote(path)]

        if (node.type === 'file') {
          args.unshift('`log`')
        }

        ctx.api.rpc(`return require('util').promisify(require('child_process').execFile)(
          ${ctx.utils.quote(smgPath)},
          [${args.join(',')}],
          {
            cwd: ${ctx.utils.quote(currentRepo.path)},
          }
        )`).catch((e: any) => {
          ctx.ui.useToast().show('warning', e.message)
          setTimeout(() => {
            ctx.ui.useToast().show('warning', i18n.t('error-tips'))
            ctx.setting.showSettingPanel(settingKeySmgPath)
          }, 1000)
        })
      }
    }

    function getItems (node: Components.Tree.Node) {
      const items: Components.ContextMenu.Item[] = []

      if (node.type === 'file' || (node.type === 'dir' && node.path === '/')) {
        items.push(
          { type: 'separator' },
          {
            id: actionName,
            label: node.type === 'file'
              ? i18n.t('show-history-in-sublime-merge')
              : i18n.t('open-in-sublime-merge'),
            onClick: () => openInSublimeMerge(node)
          }
        )
      }

      return items
    }

    ctx.action.registerAction({
      name: actionName,
      description: i18n.t('open-in-sublime-merge'),
      forUser: true,
      handler: () => {
        const repo = ctx.store.state.currentRepo
        if (repo) {
          openInSublimeMerge({ repo: repo.name, type: 'dir', path: '/' })
        }
      }
    })

    ctx.tree.tapContextMenus((items, node) => {
      items.push(...getItems(node))
    })

    ctx.workbench.FileTabs.tapTabContextMenus((items, tab) => {
      const doc = tab.payload.file
      if (!doc || ctx.doc.isOutOfRepo(doc)) {
        return
      }

      items.push(...getItems(doc))
    })
  }
})
