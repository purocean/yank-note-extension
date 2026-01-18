import { i18n } from '@/lib/core'
import type { CustomAdapterPreset } from '@/adapters/custom/index'
import type { Adapter } from '@/lib/adapter'

import requestCode from './code-request.js?raw'
import responseCode from './code-response.js?raw'

export class CompletionAnthropicPreset implements CustomAdapterPreset {
  name = 'anthropic' as const
  displayName = () => i18n.t('anthropic-compatible')
  requestCode = requestCode
  responseCode = responseCode

  private defaultEndpoint = 'https://api.anthropic.com/v1/messages'
  private defaultModel = 'claude-3-5-sonnet-20241022'

  params () {
    return {
      anthropic: {
        displayName: 'Anthropic',
        params: { model: this.defaultModel, endpoint: this.defaultEndpoint },
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
