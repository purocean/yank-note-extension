import type { CustomAdapterPreset } from '@/adapters/custom/index'
import type { Adapter } from '@/lib/adapter'

import requestCode from './code-request.js?raw'
import responseCode from './code-response.js?raw'

export class CompletionDifyWorkflowPreset implements CustomAdapterPreset {
  name = 'dify-workflow' as const
  displayName = () => 'Dify Workflow'
  requestCode = requestCode
  responseCode = responseCode

  private defaultEndpoint = 'https://api.dify.ai/v1'

  params () {
    return {
      default: {
        displayName: 'Default',
        params: { endpoint: this.defaultEndpoint },
      },
    }
  }

  processAdapter (adapter: Adapter): void {
    if (adapter.panel?.type === 'form' && Array.isArray(adapter.panel.items)) {
      if (adapter.panel?.type === 'form' && Array.isArray(adapter.panel.items)) {
        adapter.panel.items.forEach(item => {
          if (item.type === 'input' && item.key === 'endpoint') {
            item.props = { ...item.props, placeholder: 'eg. ' + this.defaultEndpoint }
            item.defaultValue = this.defaultEndpoint
          }
        })

        // remove model field
        adapter.panel.items = adapter.panel.items.filter(item => !(item.type === 'input' && item.key === 'model'))
      }
    }
  }
}
