import type { CustomAdapterPreset } from '@/adapters/custom/index'
import requestCode from './code-request.js?raw'
import responseCode from './code-response.js?raw'
import { Adapter } from '@/lib/adapter'

export class Text2ImageGradioPreset implements CustomAdapterPreset {
  name = 'gradio' as const
  displayName = () => 'Gradio'
  requestCode = requestCode
  responseCode = responseCode

  private defaultEndpoint = 'https://black-forest-labs-flux-1-schnell.hf.space'

  params () {
    return {
      default: {
        displayName: 'Default',
        params: { endpoint: this.defaultEndpoint, model: '' }
      }
    }
  }

  processAdapter (adapter: Adapter): void {
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
