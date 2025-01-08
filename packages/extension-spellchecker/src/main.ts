import { registerPlugin } from '@yank-note/runtime-api'
import { buildAlphabetRegex, defaultDicName, defaultWordRegex, fetchAvailableDictionaries, i18n, initSpellchecker, settingKeyDicName, settingKeyWordRegex } from './lib'
import { IDisposable } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register: ctx => {
    ctx.editor.whenEditorReady().then(({ editor, monaco }) => {
      const storageEnabledKey = __EXTENSION_ID__ + '.enabled'
      const toggleActionId = __EXTENSION_ID__ + '.toggle'

      const enabled = ctx.lib.vue.ref(ctx.storage.get(storageEnabledKey, true))

      let spellchecker: IDisposable | null = null

      function when () {
        return ctx.editor.isDefault()
      }

      const reloadSpellchecker = () => {
        spellchecker?.dispose()
        spellchecker = enabled.value ? initSpellchecker(monaco, editor) : null
      }

      ctx.lib.vue.watchEffect(() => {
        reloadSpellchecker()
        ctx.storage.set(storageEnabledKey, enabled.value)
        ctx.statusBar.refreshMenu()
      })

      ctx.action.registerAction({
        name: toggleActionId,
        forUser: true,
        keys: [ctx.keybinding.CtrlCmd, ctx.keybinding.Alt, 'x'],
        description: i18n.t('enable-or-disable-check-spelling-desc'),
        when,
        handler: () => {
          enabled.value = !enabled.value
        }
      })

      ctx.statusBar.tapMenus(menus => {
        if (!when()) return

        menus['status-bar-tool']?.list?.push(
          { type: 'separator' },
          {
            id: toggleActionId,
            type: 'normal',
            title: i18n.t('check-spelling'),
            checked: enabled.value,
            subTitle: ctx.keybinding.getKeysLabel(toggleActionId),
            onClick: () => {
              ctx.action.getActionHandler(toggleActionId)()
            },
          },
          { type: 'separator' },
        )
      })

      ctx.setting.changeSchema((schema) => {
        schema.properties[settingKeyDicName] = {
          title: i18n.$$t('setting-dictionary'),
          type: 'string',
          enum: [],
          options: {
            enum_titles: [],
            inputAttributes: {}
          },
          description: i18n.$$t('setting-dictionary-desc', ''),
          defaultValue: defaultDicName,
          group: 'plugin',
          required: true,
        }

        schema.properties[settingKeyWordRegex] = {
          title: i18n.$$t('setting-word-regex'),
          type: 'string',
          description: i18n.$$t('setting-word-regex-desc'),
          options: {},
          defaultValue: defaultWordRegex,
          group: 'plugin',
          required: true,
          validator: (_schema, value: string, path: string) => {
            if (value) {
              try {
                buildAlphabetRegex(value, false)
              } catch (error) {
                return [{
                  path,
                  property: settingKeyWordRegex,
                  message: error.message
                }]
              }
            } else {
              return [{
                path,
                property: settingKeyWordRegex,
                message: 'Value is required'
              }]
            }

            return []
          },
        }
      })

      ctx.registerHook('SETTING_PANEL_BEFORE_SHOW', async () => {
        const items = await fetchAvailableDictionaries().catch(() => [])
        const userDataDirPath = await ctx.api.rpc("return require('./constant').USER_DATA")

        ctx.setting.changeSchema((schema) => {
          schema.properties[settingKeyDicName].enum = items
          schema.properties[settingKeyDicName].description = i18n.t('setting-dictionary-desc', userDataDirPath.replace(/\\/g, '/'))
        })
      })

      ctx.registerHook('SETTING_CHANGED', async ({ changedKeys }) => {
        if (changedKeys.includes(settingKeyDicName as any) || changedKeys.includes(settingKeyWordRegex as any)) {
          reloadSpellchecker()
        }
      })
    })
  }
})
