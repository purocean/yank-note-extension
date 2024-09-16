import { CompletionDifyWorkflowPreset } from '@/adapters/custom/completion/dify-workflow'
import requestCode from './code-request.js?raw'
import responseCode from './code-response.js?raw'

export class EditDifyWorkflowPreset extends CompletionDifyWorkflowPreset {
  requestCode = requestCode
  responseCode = responseCode
}
