import { registerPlugin } from '@yank-note/runtime-api'
import prettier from 'prettier/esm/standalone'
import prettierMarkdown from 'prettier/esm/parser-markdown'

const extensionId = __EXTENSION_ID__
const settingKeyFormatOnSave = 'plugin.markdown-prettier.format-on-save'

registerPlugin({
  name: extensionId,
  register: ctx => {
    function formatMarkdown (text: string) {
      if (!ctx.getPremium()) {
        ctx.ui.useToast().show('info', ctx.i18n.t('premium.need-purchase', extensionId))
        ctx.showPremium()
        throw new Error('Extension requires premium')
      }

      return prettier.format(text, {
        parser: 'markdown',
        plugins: [prettierMarkdown],
      })
    }

    const i18n = ctx.i18n.createI18n({
      en: {
        'format-markdown': 'Format Markdown',
        'format-on-save': 'Format on Save -- Markdown Prettier',
      },
      'zh-CN': {
        'format-markdown': '格式化 Markdown',
        'format-on-save': '保存时格式化 -- Markdown Prettier',
      }
    })

    const action = ctx.action.registerAction({
      name: 'plugin.markdown-prettier.format-markdown',
      keys: [ctx.command.CtrlCmd, ctx.command.Shift, 'f'],
      handler: () => {
        const text = formatMarkdown(ctx.editor.getValue())
        ctx.editor.setValue(text)
      },
    })

    ctx.statusBar.tapMenus((menus) => {
      if (!ctx.store.state.showEditor || ctx.store.state.presentation) {
        return
      }

      menus['status-bar-tool']?.list?.push(
        {
          id: action.name,
          type: 'normal',
          title: i18n.t('format-markdown'),
          subTitle: ctx.command.getKeysLabel(action.name),
          onClick: () => ctx.action.getActionHandler(action.name)()
        },
      )
    })

    if (ctx.lib.semver.satisfies(ctx.version, '>=3.35.0') && ctx.getPremium()) {
      ctx.setting.changeSchema((schema) => {
        schema.properties[settingKeyFormatOnSave] = {
          title: i18n.$$t('format-on-save'),
          type: 'boolean',
          defaultValue: false,
          format: 'checkbox',
          group: 'editor',
          required: true,
        }
      })

      ctx.registerHook('DOC_BEFORE_SAVE' as any, (payload: any) => {
        if (!ctx.setting.getSetting<boolean>(settingKeyFormatOnSave)) {
          return
        }

        if (ctx.doc.toUri(payload.doc) !== ctx.editor.getEditor().getModel()?.uri.toString()) {
          return
        }

        payload.content = formatMarkdown(payload.content)

        ctx.editor.setValue(payload.content)
      })
    }
  }
})
