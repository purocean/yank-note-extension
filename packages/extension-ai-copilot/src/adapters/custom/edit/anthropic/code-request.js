const { selectedText, instruction, context, system, state } = data

// if context is not provided, system message will be empty
const systemMessage = context ? (system || '').replace('{CONTEXT}', context) : ''
const userMessage = `
Instruction: ${instruction}

${selectedText}
`.trim()

const url = state.endpoint

const headers = {
  'x-api-key': state.apiToken,
  'anthropic-version': '2023-06-01',
  'Content-Type': 'application/json',
}

const body = JSON.stringify({
  model: state.model,
  max_tokens: 4096,
  stream: true,
  messages: [{
    role: "user",
    content: userMessage
  }],
  system: systemMessage || 'ATTENTION: OUTPUT THE CONTENT DIRECTLY, NO SURROUNDING OR OTHER CONTENT.'
})

const sse = true // use server-sent events to stream the response

return { url, headers, body, method: 'POST', sse }
