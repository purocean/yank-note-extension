import { Ctx, ctx, registerPlugin } from '@yank-note/runtime-api'
import Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'

const { getLogger } = ctx.utils

const extensionId = __EXTENSION_ID__
const actionName = 'plugin.editor-openai.trigger'
const settingKeyToken = 'plugin.editor-openai.api-token'
const settingKeyEngine = 'plugin.editor-openai.engine-id'
const settingKeyMode = 'plugin.editor-openai.mode'
const settingKeyMaxTokens = 'plugin.editor-openai.max-tokens'
const settingKeyRange = 'plugin.editor-openai.range'
const settingKeyArgs = 'plugin.editor-openai.args-json'
const defaultEngine = 'text-davinci-002'

class CompletionProvider implements Monaco.languages.InlineCompletionsProvider {
  private readonly monaco: typeof Monaco
  private readonly ctx: Ctx
  private logger = getLogger(extensionId)

  constructor (monaco: typeof Monaco, ctx: Ctx) {
    this.monaco = monaco
    this.ctx = ctx
  }

  freeInlineCompletions (): void {
    this.ctx.ui.useToast().hide()
  }

  handleItemDidShow (): void {
    this.ctx.ui.useToast().hide()
  }

  public async provideInlineCompletions (model: Monaco.editor.IModel, position: Monaco.Position, context: Monaco.languages.InlineCompletionContext): Promise<Monaco.languages.InlineCompletions> {
    if (context.triggerKind !== this.monaco.languages.InlineCompletionTriggerKind.Explicit) {
      return { items: [] }
    }

    this.ctx.ui.useToast().show('info', 'OpenAI: Loading...', 10000)

    const range = this.ctx.setting.getSetting<number>(settingKeyRange, 256)

    let prefix = ''
    let suffix = ''

    // get selection of editor model
    const selection = this.ctx.editor.getEditor().getSelection()
    const selectionText = selection && model.getValueInRange(selection)

    if (selectionText) {
      prefix = selectionText
      position = selection!.getEndPosition()
    } else {
      const contentPrefix = model.getValueInRange(new this.monaco.Range(
        1,
        1,
        position.lineNumber,
        position.column,
      ))

      const maxLine = model.getLineCount()
      const maxColumn = model.getLineMaxColumn(maxLine)

      const contentSuffix = model.getValueInRange(new this.monaco.Range(
        position.lineNumber,
        position.column,
        maxLine,
        maxColumn,
      ))

      prefix = contentPrefix.substring(Math.max(0, contentPrefix.length - range))
      suffix = contentSuffix.substring(0, range)
    }

    this.logger.debug('provideInlineCompletions', range, prefix, suffix)

    return {
      items: await this.provideSuggestions(prefix, suffix, position)
    }
  }

  private async provideSuggestions (prompt: string, suffix: string, position: Monaco.Position): Promise<Monaco.languages.InlineCompletion[]> {
    const range = new this.monaco.Range(
      position.lineNumber,
      position.column,
      position.lineNumber,
      position.column,
    )

    const token = this.ctx.setting.getSetting(settingKeyToken, '')

    if (token.length < 40) {
      setTimeout(() => {
        this.ctx.ui.useToast().show('warning', 'OpenAI: No API token')
        this.ctx.setting.showSettingPanel('openai')
      }, 0)
      return []
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }

    let args = {}
    try {
      args = JSON.parse(this.ctx.setting.getSetting(settingKeyArgs, '{}'))
    } catch (e: any) {
      this.ctx.ui.useToast().show('warning', `OpenAI: Custom Arguments Error "${e.message}"`, 5000)
      throw e
    }

    const mode = this.ctx.setting.getSetting(settingKeyMode, 'insert')
    const maxTokens = this.ctx.setting.getSetting(settingKeyMaxTokens, 256)

    const body = {
      temperature: 0.3,
      n: 1,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      // stop: '\n',
      ...args,
      prompt: prompt,
      max_tokens: maxTokens,
      suffix: mode === 'insert' && suffix.trim() ? suffix : undefined
    }

    const engineId = this.ctx.setting.getSetting('plugin.editor-openai.engine-id', defaultEngine)

    this.logger.debug('provideSuggestions', 'request', engineId, body)

    try {
      const res = await this.ctx.api.proxyRequest(
        `https://api.openai.com/v1/engines/${engineId}/completions`,
        { headers, body: JSON.stringify(body), method: 'post' },
        true
      ).then(x => x.json())

      this.logger.debug('provideSuggestions', 'result', res)

      if (!res.choices) {
        this.ctx.ui.useToast().show('warning', JSON.stringify(res), 5000)
        return []
      }

      return res.choices.map((x: any) => ({
        text: x.text,
        range,
      }))
    } catch (error: any) {
      this.ctx.ui.useToast().show('warning', error.message || `${error}`, 5000)
      this.logger.error('provideSuggestions', 'error', error)
      throw error
    }
  }
}

const i18n = ctx.i18n.createI18n({
  en: {
    'openai-complete': 'OpenAI Complete',
    'api-token': 'Api Token',
    'api-token-desc': 'You can get your api token from <a target="_blank" href="http://openai.com">openai.com</a>',
    'engine-id': 'Engine Id',
    'engine-id-desc': 'Please refer to <a target="_blank" href="https://beta.openai.com/docs/engines/overview/">Engine Overview</a>',
    mode: 'Mode',
    range: 'Characters Range',
    'range-desc': 'Context characters range',
    'max-tokens': 'Max Tokens',
    'args-json': 'Custom Arguments',
    'args-json-desc': 'Query parameters, JSON string like {"temperature": 0.3}',
  },
  'zh-CN': {
    'openai-complete': 'OpenAI 自动补全',
    'api-token': 'Api Token',
    'api-token-desc': '你可以从 <a target="_blank" href="http://openai.com">openai.com</a> 获取',
    'engine-id': 'Engine Id',
    'engine-id-desc': '请参考 <a target="_blank" href="https://beta.openai.com/docs/engines/overview/">Engine Overview</a>',
    mode: '模式',
    range: '字符范围',
    'range-desc': '上下文字符范围',
    'max-tokens': 'Max Tokens',
    'args-json': '自定义参数',
    'args-json-desc': '请求参数，JSON 字符串如 {"temperature": 0.3}',
  }
})

registerPlugin({
  name: extensionId,
  register (ctx) {
    ctx.editor.whenEditorReady().then(({ monaco }) => {
      monaco.languages.registerInlineCompletionsProvider(
        'markdown',
        new CompletionProvider(monaco, ctx)
      )
    })

    ctx.setting.changeSchema((schema) => {
      schema.groups.push({ label: 'OpenAI' as any, value: 'openai' as any })

      schema.properties[settingKeyMode] = {
        title: i18n.$$t('mode'),
        type: 'string',
        defaultValue: 'insert',
        enum: ['insert', 'complete'],
        group: 'openai' as any,
        required: true,
      }

      schema.properties[settingKeyEngine] = {
        title: i18n.$$t('engine-id'),
        description: i18n.$$t('engine-id-desc'),
        type: 'string',
        defaultValue: defaultEngine,
        group: 'openai' as any,
        enum: [
          'text-davinci-002',
          'text-curie-001',
          'text-babbage-001',
          'text-ada-001',
        ],
        required: true,
      }

      schema.properties[settingKeyToken] = {
        title: i18n.$$t('api-token'),
        description: i18n.$$t('api-token-desc'),
        type: 'string',
        defaultValue: '',
        group: 'openai' as any,
        options: {
          inputAttributes: { placeholder: 'sk-' + 'x'.repeat(10) }
        },
      }

      schema.properties[settingKeyMaxTokens] = {
        title: i18n.$$t('max-tokens'),
        type: 'number',
        defaultValue: 256,
        group: 'openai' as any,
        required: true,
        minimum: 4,
        maximum: 4096,
        options: {
          inputAttributes: { placeholder: i18n.$$t('max-tokens') }
        },
      }

      schema.properties[settingKeyRange] = {
        title: i18n.$$t('range'),
        type: 'number',
        defaultValue: 256,
        group: 'openai' as any,
        required: true,
        minimum: 10,
        maximum: 10240,
        options: {
          inputAttributes: { placeholder: i18n.$$t('range-desc') }
        },
      }

      schema.properties[settingKeyArgs] = {
        title: i18n.$$t('args-json'),
        description: i18n.$$t('args-json-desc'),
        type: 'string',
        defaultValue: '{"temperature": 0.3}',
        group: 'openai' as any,
        options: {
          inputAttributes: { placeholder: '{"temperature": 0.3}' }
        },
      }
    })

    ctx.action.registerAction({
      name: actionName,
      keys: [ctx.command.CtrlCmd, ctx.command.Alt, 'Period'],
      handler: () => {
        ctx.editor.getEditor().getAction('editor.action.inlineSuggest.trigger').run()
        ctx.editor.getEditor().focus()
      },
      when: () => ctx.store.state.showEditor && !ctx.store.state.presentation,
    })

    ctx.statusBar.tapMenus((menus) => {
      if (!ctx.store.state.showEditor || ctx.store.state.presentation) {
        return
      }

      menus['status-bar-tool']?.list?.push(
        {
          id: actionName,
          type: 'normal',
          title: i18n.t('openai-complete'),
          subTitle: ctx.command.getKeysLabel(actionName),
          onClick: () => ctx.action.getActionHandler(actionName)()
        },
      )
    })
  }
})
