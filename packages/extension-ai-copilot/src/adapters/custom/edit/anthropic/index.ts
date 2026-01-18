import { CompletionAnthropicPreset } from '@/adapters/custom/completion/anthropic'
import requestCode from './code-request.js?raw'
import responseCode from './code-response.js?raw'

export class EditAnthropicPreset extends CompletionAnthropicPreset {
  requestCode = requestCode
  responseCode = responseCode
}
