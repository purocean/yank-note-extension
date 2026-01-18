const { context, system, state } = data

const url = state.endpoint

const headers = {
  'x-api-key': state.apiToken,
  'anthropic-version': '2023-06-01',
  'Content-Type': 'application/json',
}

const systemMessage = context ? (system || '').replace('{CONTEXT}', context) : (system || '')

const body = JSON.stringify({
  model: state.model,
  max_tokens: 4096,
  messages: [{
    role: "user",
    content: context
  }],
  system: systemMessage
})

return { url, headers, body, method: 'POST' }
