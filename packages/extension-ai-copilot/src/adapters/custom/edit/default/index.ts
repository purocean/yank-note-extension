import { CompletionDefaultPreset } from '@/adapters/custom/completion/default'
import requestCode from './code-request.js?raw'
import responseCode from './code-response.js?raw'

export class EditDefaultPreset extends CompletionDefaultPreset {
  requestCode = requestCode
  responseCode = responseCode
}
