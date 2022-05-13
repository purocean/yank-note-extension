import { ctx, registerPlugin } from '@yank-note/runtime-api'
import { buildSrcdoc, createLuckysheet, fileExt, MarkdownItPlugin } from './luckysheet'
import i18n from './i18n'

import './style.css'

const { openWindow } = ctx.env
const { t } = i18n
const { buildSrc } = ctx.embed

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    ctx.markdown.registerPlugin(MarkdownItPlugin)

    ctx.registerHook('TREE_NODE_SELECT', async ({ node }) => {
      if (node.path.toLowerCase().endsWith(fileExt)) {
        const srcdoc = buildSrcdoc(node.repo, node.path, true)
        openWindow(buildSrc(srcdoc, t('edit-sheet'), false), '_blank', { alwaysOnTop: false })

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
            label: t('create-dialog-title'),
            onClick: () => createLuckysheet(node)
          }
        )
      }
    })
  }
})
