import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { ctx } from '@yank-note/runtime-api'
import { languages } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { EDIT_ACTION_NAME, i18n } from './core'
import { process } from './process'

export class CodeActionProvider implements Monaco.languages.CodeActionProvider {
  logger = ctx.utils.getLogger(__EXTENSION_ID__ + '.CodeActionProvider')

  provideCodeActions (_model: Monaco.editor.ITextModel, range: Monaco.Range): Monaco.languages.ProviderResult<Monaco.languages.CodeActionList> {
    // no selection and cursor not in end of line, no actions
    if (range.isEmpty()) {
      return { dispose: () => 0, actions: [] }
    }

    const editTitle = i18n.t('renumber')

    const actions: Monaco.languages.CodeAction[] = [{
      title: i18n.t('renumber'),
      command: { id: EDIT_ACTION_NAME, title: editTitle },
      kind: 'refactor',
      isPreferred: false,
      diagnostics: [],
    }]

    return {
      dispose: () => 0,
      actions: actions
    }
  }

  async resolveCodeAction (codeAction: languages.CodeAction): Promise<Monaco.languages.CodeAction | undefined> {
    if (codeAction.command?.id) {
      ctx.action.getActionHandler(codeAction.command.id)?.()
    }

    return undefined
  }
}

export function executeEdit () {
  const selection = ctx.editor.getEditor().getSelection()
  if (!selection) {
    return
  }

  const model = ctx.editor.getEditor().getModel()
  if (!model) {
    return
  }

  const text = model.getValueInRange(selection)
  const res = process(text)

  ctx.editor.getEditor().executeEdits(EDIT_ACTION_NAME, [{
    range: selection,
    text: res,
  }])
}
