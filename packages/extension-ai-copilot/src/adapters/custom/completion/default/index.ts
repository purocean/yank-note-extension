import { i18n } from '@/lib/core'
import type { CustomAdapterPreset } from '@/adapters/custom/index'
import type { Adapter } from '@/lib/adapter'

import requestCode from './code-request.js?raw'
import responseCode from './code-response.js?raw'

export class CompletionDefaultPreset implements CustomAdapterPreset {
  name = 'custom' as const
  displayName = () => i18n.t('custom') + '-Workers AI'
  requestCode = requestCode
  responseCode = responseCode

  private defaultEndpoint = 'https://api.cloudflare.com/client/v4/accounts/API_ACCOUNT_ID'
  private defaultModel = '@cf/meta/llama-3-8b-instruct'

  params () {
    return {
      default: {
        displayName: 'Default',
        params: { endpoint: this.defaultEndpoint, model: this.defaultModel }
      }
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
