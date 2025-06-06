const { context, system, state } = data

const messages = [
  {
    role: "system",
    content: system.replace('{CONTEXT}', context)
  },
  {
    role: "user",
    content: context
  },
]

const url = env.fixOpenAiChatCompletionUrl(state.endpoint)

const headers = {
  'Authorization': `Bearer ${state.apiToken}`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ messages, model: state.model })

return { url, headers, body, method: 'POST' }
