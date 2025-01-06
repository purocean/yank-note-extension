const { res, sse } = data

if (sse) {
  if (res === '[DONE]') {
    return { done: true }
  }

  const event = JSON.parse(res)

  let delta = ''

  switch (event.event) {
    case 'workflow_started':
      env.updateStatus('🏃 Workflow started')
      break
    case 'node_started':
      env.updateStatus('🏃 ' + (event.data.title || ''))
      break
    case 'node_finished':
      env.updateStatus('✅ ' + (event.data.title || ''))
      break
    case 'text_chunk':
      env.updateStatus('🚧 Working')
      delta = event.data.text
      break
    case 'workflow_finished':
      env.updateStatus('✅ ' + 'Workflow finished')
      return { text: event.data.outputs.text }
    case 'tts_message':
    case 'tts_message_end':
    case 'ping':
      // ignore
      break
    default:
      console.log('Unknown event', event)
  }

  return { delta }
} else {
  const obj = await res.json()
  const text = obj.data.outputs.text
  return { text }
}
