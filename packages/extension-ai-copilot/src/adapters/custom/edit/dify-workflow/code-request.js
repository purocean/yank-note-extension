const { selectedText, instruction, context, system, state } = data

const url = `${state.endpoint}/workflows/run`

const headers = {
  'Authorization': `Bearer ${state.apiToken}`,
  'Content-Type': 'application/json',
}

const payload = {
  inputs: {
    content: selectedText || '',
    context: context || '',
    system: system || '',
    instruction: instruction || '',
  },
  response_mode: 'streaming',
  user: 'Yank Note'
}

const body = JSON.stringify(payload)

const sse = payload.response_mode === 'streaming'

return { url, headers, body, method: 'POST', sse }
