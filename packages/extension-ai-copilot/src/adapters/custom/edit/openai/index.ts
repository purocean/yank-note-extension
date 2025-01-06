import { CompletionOpenAIPreset } from '@/adapters/custom/completion/openai'
import requestCode from './code-request.js?raw'
import responseCode from './code-response.js?raw'

export class EditOpenAIPreset extends CompletionOpenAIPreset {
  requestCode = requestCode
  responseCode = responseCode
}
