const { selectedText, instruction, context, system, state } = data

// if context is not provided, system message will be empty
const systemMessage = context ? system.replace('{CONTEXT}', context) : ''
const userMessage = `
Instruction: ${instruction}

${selectedText}
`.trim()

const messages = [{
  role: "user",
  content: userMessage
}]

messages.unshift({
  role: "system",
  content: systemMessage || 'ATTENTION: OUTPUT THE CONTENT DIRECTLY, NO SURROUNDING OR OTHER CONTENT.'
})

const url = `${state.endpoint}/ai/run/${state.model}`

const headers = {
  'Authorization': `Bearer ${state.apiToken}`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ messages, stream: true })
const sse = true // use server-sent events to stream the response

return { url, headers, body, method: 'POST', sse }
