const { state: { width, height, endpoint, apiToken, instruction, model } } = data

const url = `${endpoint}/ai/run/${model}`

const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({ prompt: instruction, width, height })

return { url, headers, body, method: 'POST' }
