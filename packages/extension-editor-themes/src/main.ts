import { registerPlugin } from '@yank-note/runtime-api'
import { darkThemes, lightThemes } from './themes'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    const i18n = ctx.i18n.createI18n({
      en: {
        'editor-theme-light': 'Editor Theme Light',
        'editor-theme-dark': 'Editor Theme Dark',
      },
      'zh-CN': {
        'editor-theme-light': '编辑器主题 (亮)',
        'editor-theme-dark': '编辑器主题 (暗)',
      }
    })

    const settingKeyEditorThemeLight = 'plugin.editor-themes.light'
    const settingKeyEditorThemeDark = 'plugin.editor-themes.dark'

    ctx.setting.changeSchema((schema) => {
      schema.properties[settingKeyEditorThemeLight] = {
        title: i18n.$$t('editor-theme-light'),
        type: 'string',
        enum: lightThemes.map(x => x.name),
        options: {
          enum_titles: lightThemes.map(x => x.displayName),
          inputAttributes: { onchange: 'ctx.editor.getMonaco().editor.setTheme(this.value)' }
        },
        defaultValue: 'vs',
        group: 'appearance',
        required: true,
      }

      schema.properties[settingKeyEditorThemeDark] = {
        title: i18n.$$t('editor-theme-dark'),
        type: 'string',
        enum: darkThemes.map(x => x.name),
        options: {
          enum_titles: darkThemes.map(x => x.displayName),
          inputAttributes: { onchange: 'ctx.editor.getMonaco().editor.setTheme(this.value)' }
        },
        defaultValue: 'vs-dark',
        group: 'appearance',
        required: true,
      }
    })

    function updateTheme () {
      ctx.editor.whenEditorReady().then(({ monaco }) => {
        const theme = ctx.theme.getColorScheme() === 'dark'
          ? ctx.setting.getSetting(settingKeyEditorThemeDark, 'vs-dark')
          : ctx.setting.getSetting(settingKeyEditorThemeLight, 'vs')
        monaco.editor.setTheme(theme)
      })
    }

    ctx.editor.whenEditorReady().then(({ monaco }) => {
      [...lightThemes, ...darkThemes].forEach((x) => {
        if (x.theme) {
          monaco.editor.defineTheme(x.name, x.theme as any)
        }
      })

      updateTheme()
    })

    ctx.registerHook('THEME_CHANGE', updateTheme)
    ctx.registerHook('SETTING_FETCHED', updateTheme)
    ctx.store.watch(() => ctx.store.state.showSetting, updateTheme)
  }
})
