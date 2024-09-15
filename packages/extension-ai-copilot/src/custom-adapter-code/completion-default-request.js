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

const url = `${state.endpoint}/ai/run/${state.model}`

const headers = {
  'Authorization': `Bearer ${state.apiToken}`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ messages })

return { url, headers, body, method: 'POST' }
