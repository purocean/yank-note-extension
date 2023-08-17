import { ctx } from '@yank-note/runtime-api'
import { reactive, ref, watch } from 'vue'

export const settingKeyToken = 'plugin.editor-openai.api-token'
export const actionName = __EXTENSION_ID__ + '.trigger'

export const models = [
  'text-davinci-003',
  'text-curie-001',
  'text-babbage-001',
  'text-ada-001',
  'code-davinci-002',
  'code-cushman-001',
]

export const editModels = [
  'text-davinci-edit-001',
  'code-davinci-edit-001',
]

export const chatModels = [
  'gpt-3.5-turbo',
]

export const i18n = ctx.i18n.createI18n({
  en: {
    'openai-complete': 'OpenAI Complete',
    'api-token': 'OpenAI Api Token',
    'api-token-desc': 'You can get your api token from <a target="_blank" href="http://openai.com">openai.com</a>',
  },
  'zh-CN': {
    'openai-complete': 'OpenAI 自动补全',
    'api-token': 'OpenAI Api Token',
    'api-token-desc': '你可以从 <a target="_blank" href="http://openai.com">openai.com</a> 获取',
  }
})

const defaultSetting = {
  type: 'completion' as 'completion' | 'edit' | 'chat',
  chatSystem: '',
  chatModel: chatModels[0],
  input: '',
  instruction: '',
  instructionHistory: [] as string[],
  chatSystemHistory: [] as string[],
  editModel: editModels[0],
  enable: true,
  prefix: '',
  suffix: '',
  model: models[0],
  prefixLength: 128,
  suffixLength: 128,
  maxTokens: 1024,
  topP: 1,
  temperature: 0.3,
  presencePenalty: 0,
  frequencyPenalty: 0,
  stopSequences: '',
}

const storageSettingKey = __EXTENSION_ID__ + '.setting'
export const setting = reactive({
  ...defaultSetting,
  ...ctx.utils.storage.get(storageSettingKey, defaultSetting)
})

if (!models.includes(setting.model)) {
  setting.model = models[0]
}

if (!editModels.includes(setting.editModel)) {
  setting.editModel = editModels[0]
}

if (!chatModels.includes(setting.chatModel)) {
  setting.chatModel = chatModels[0]
}

const saveSetting = ctx.lib.lodash.debounce(() => {
  ctx.utils.storage.set(storageSettingKey, ctx.lib.lodash.omit(setting, ['suffix', 'prefix']))
}, 1000, { leading: true })

watch(setting, saveSetting)

export const loading = ref(false)

export async function requestApi (url: string, body?: any) {
  if (loading.value) {
    throw new Error('Loading')
  }

  const token = ctx.setting.getSetting(settingKeyToken, '')

  if (token.length < 40) {
    setTimeout(() => {
      ctx.setting.showSettingPanel(settingKeyToken)
    }, 0)
    throw new Error('No API token')
  }

  const headers = { Authorization: `Bearer ${token}` }

  if (body) {
    body = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }

  try {
    loading.value = true
    const x = await ctx.api.proxyRequest(
      url,
      { headers, body: body, method: body ? 'post' : 'get' },
      true
    )

    return await x.json()
  } finally {
    loading.value = false
  }
}
