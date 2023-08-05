import { registerPlugin } from '@yank-note/runtime-api'
import prettier from 'prettier/standalone'
import prettierMarkdown from 'prettier/parser-markdown'

const extensionId = __EXTENSION_ID__
const settingKeyFormatOnSave = 'plugin.markdown-prettier.format-on-save'

registerPlugin({
  name: extensionId,
  register: ctx => {
    function formatMarkdown (text: string, opts?: { tabWidth?: number, useTabs?: boolean }) {
      if (!ctx.getPremium()) {
        ctx.ui.useToast().show('info', ctx.i18n.t('premium.need-purchase', extensionId))
        ctx.showPremium()
        throw new Error('Extension requires premium')
      }

      return prettier.format(text, {
        parser: 'markdown',
        plugins: [prettierMarkdown],
        ...opts,
      })
    }

    const i18n = ctx.i18n.createI18n({
      en: {
        'format-markdown': 'Format Markdown',
        'format-on-save': 'Format on Save - Markdown Prettier',
      },
      'zh-CN': {
        'format-markdown': '格式化 Markdown',
        'format-on-save': '保存时格式化 - Markdown Prettier',
      }
    })

    ctx.editor.whenEditorReady().then(({ monaco }) => {
      monaco.editor.addKeybindingRules([
        {
          keybinding: monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
          command: '-editor.action.formatDocument'
        },
        {
          keybinding: monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
          command: 'editor.action.formatDocument'
        },
      ])

      monaco.languages.registerDocumentFormattingEditProvider('markdown', {
        provideDocumentFormattingEdits: (model, options) => {
          const text = formatMarkdown(model.getValue(), {
            tabWidth: options.tabSize,
            useTabs: !options.insertSpaces,
          })

          return [{
            range: model!.getFullModelRange(),
            text,
          }]
        }
      })

      monaco.languages.registerDocumentRangeFormattingEditProvider('markdown', {
        provideDocumentRangeFormattingEdits: (model, range, options) => {
          const text = formatMarkdown(model.getValueInRange(range), {
            tabWidth: options.tabSize,
            useTabs: !options.insertSpaces,
          })

          return [{ range, text }]
        }
      })
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

      ctx.registerHook('DOC_BEFORE_SAVE', async (payload) => {
        if (!ctx.setting.getSetting<boolean>(settingKeyFormatOnSave)) {
          return
        }

        if (ctx.doc.toUri(payload.doc) !== ctx.editor.getEditor().getModel()?.uri.toString()) {
          return
        }

        const editor = ctx.editor.getEditor()

        await editor.getAction('editor.action.formatDocument').run()
        editor.focus()
        payload.content = ctx.editor.getValue()
      })
    }
  }
})
