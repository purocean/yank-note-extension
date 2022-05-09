import { registerPlugin } from '@yank-note/runtime-api'

const extensionName = __EXTENSION_ID__

registerPlugin({
  name: extensionName,
  register (ctx) {
    ctx.i18n.mergeLanguage('en', {
      [extensionName]: {
        'open-in-sublime-merge': 'Open in Sublime Merge',
        'show-history-in-sublime-merge': 'Show History in Sublime Merge',
      },
    })

    ctx.i18n.mergeLanguage('zh-CN', {
      [extensionName]: {
        'open-in-sublime-merge': '在 Sublime Merge 中打开',
        'show-history-in-sublime-merge': '在 Sublime Merge 中显示历史',
      },
    })

    ctx.tree.tapContextMenus((items, node) => {
      const openInSublimeMerge = () => {
        const currentRepo = ctx.store.state.currentRepo
        const path = currentRepo ? ctx.utils.path.join(currentRepo.path, node.path) : ''
        if (path && currentRepo) {
          if (node.type === 'dir') {
            ctx.api.runCode('bash', `smg '${path}'`)
          } else {
            ctx.api.runCode('bash', `cd '${currentRepo.path}' && smg log '${path}'`)
          }
        }
      }

      if (node.type === 'file' || (node.type === 'dir' && node.path === '/')) {
        items.push(
          { type: 'separator' },
          {
            id: extensionName + '-openInSublimeMerge',
            label: node.type === 'file'
              ? ctx.i18n.t(`${extensionName}.show-history-in-sublime-merge`)
              : ctx.i18n.t(`${extensionName}.open-in-sublime-merge`),
            onClick: openInSublimeMerge
          }
        )
      }

      return items
    })
  }
})
