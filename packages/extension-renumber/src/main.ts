import { registerPlugin } from '@yank-note/runtime-api'
import { CodeActionProvider } from './actions'
import { EDIT_ACTION_NAME, i18n } from './core'
import { createWidget } from './widget'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    ctx.editor.whenEditorReady().then(({ monaco }) => {
      monaco.languages.registerCodeActionProvider('*', new CodeActionProvider())
    })

    ctx.action.registerAction({
      name: EDIT_ACTION_NAME,
      description: i18n.t('renumber'),
      forUser: true,
      handler: async () => {
        createWidget()
      },
      when: () => ctx.store.state.showEditor && !ctx.store.state.presentation,
    })
  }
})
