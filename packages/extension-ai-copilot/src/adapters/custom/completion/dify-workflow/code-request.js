const { context, system, state } = data

const url = `${state.endpoint}/workflows/run`

const headers = {
  'Authorization': `Bearer ${state.apiToken}`,
  'Content-Type': 'application/json',
}

const body = JSON.stringify({
  inputs: {
    context: context || '',
    system: system || '',
  },
  response_mode: 'blocking',
  user: 'Yank Note'
})

return { url, headers, body, method: 'POST' }
