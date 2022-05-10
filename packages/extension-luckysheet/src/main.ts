import { ctx, registerPlugin } from '@yank-note/runtime-api'
import { buildSrcdoc, createLuckysheet, fileExt, MarkdownItPlugin } from './luckysheet'

import './style.css'

const { openWindow } = ctx.env
const { t } = ctx.i18n
const { buildSrc } = ctx.embed

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    ctx.markdown.registerPlugin(MarkdownItPlugin)

    ctx.i18n.mergeLanguage('en', {
      [extensionId]: {
        'saved-at': 'Saved at',
        'edit-sheet': 'Edit Sheet',
        'create-dialog-title': 'Create Luckysheet File',
      },
    })

    ctx.i18n.mergeLanguage('zh-CN', {
      [extensionId]: {
        'saved-at': '保存于',
        'edit-sheet': '编辑表格',
        'create-dialog-title': '创建 Luckysheet 文件',
      },
    })

    ctx.registerHook('TREE_NODE_SELECT', async ({ node }) => {
      if (node.path.toLowerCase().endsWith(fileExt)) {
        const srcdoc = buildSrcdoc(node.repo, node.path, true)
        openWindow(buildSrc(srcdoc, t(`${extensionId}.edit-sheet`), false), '_blank', { alwaysOnTop: false })

        return true
      }

      return false
    })

    ctx.tree.tapContextMenus((items, node) => {
      if (node.type === 'dir') {
        items.push(
          { type: 'separator' },
          {
            id: 'create-luckysheet',
            type: 'normal',
            label: t(`${extensionId}.create-dialog-title`),
            onClick: () => createLuckysheet(node)
          }
        )
      }
    })
  }
})
