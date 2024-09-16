import { i18n } from '@/lib/core'
import type { CustomAdapterPreset } from '@/adapters/custom/index'
import type { Adapter } from '@/lib/adapter'

import requestCode from './code-request.js?raw'
import responseCode from './code-response.js?raw'

export class CompletionOpenAIPreset implements CustomAdapterPreset {
  name = 'openai' as const
  displayName = () => i18n.t('openai-compatible')
  requestCode = requestCode
  responseCode = responseCode

  private defaultEndpoint = 'https://api.openai.com/v1/chat/completions'
  private defaultModel = 'gpt-4o-mini'

  params () {
    return {
      ollama: {
        displayName: 'Ollama',
        params: { model: 'llama3.1', endpoint: 'http://127.0.0.1:11434/v1/chat/completions' },
      },
      kimi: {
        displayName: 'Kimi',
        params: { model: 'moonshot-v1-8k', endpoint: 'https://api.moonshot.cn/v1/chat/completions' },
      },
      dashscope: {
        displayName: '阿里云-灵积',
        params: { model: 'qwen-turbo', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' },
      },
      openai: {
        displayName: 'OpenAI',
        params: { model: 'gpt-4o-mini', endpoint: this.defaultEndpoint },
      },
      spark: {
        displayName: 'Spark',
        params: { model: 'generalv3.5', endpoint: 'https://spark-api-open.xf-yun.com/v1/chat/completions' },
      },
      custom: {
        displayName: i18n.t('custom'),
        params: { model: '', endpoint: '' },
      },
    }
  }

  processAdapter (adapter: Adapter): void {
    if (adapter.panel?.type === 'form' && Array.isArray(adapter.panel.items)) {
      adapter.panel.items.forEach(item => {
        if (item.type === 'input' && item.key === 'endpoint') {
          item.props = { ...item.props, placeholder: 'eg. ' + this.defaultEndpoint }
          item.defaultValue = this.defaultEndpoint
        } else if (item.type === 'input' && item.key === 'model') {
          item.props = { ...item.props, placeholder: 'eg. ' + this.defaultModel }
          item.defaultValue = this.defaultModel
        }
      })
    }
  }
}
