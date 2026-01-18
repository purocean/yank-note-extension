const { res } = data

if (!res || res.trim() === '') {
  return { done: false }
}

const lines = res.trim().split('\n')
const lastLine = lines[lines.length - 1]

if (lastLine === 'event: message_stop') {
  return { done: true }
}

// Parse data lines
for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i]
  if (line.startsWith('data: ')) {
    const payload = JSON.parse(line.substring(6))
    
    if (payload.type === 'content_block_delta' && payload.delta?.type === 'text_delta') {
      return { delta: payload.delta.text }
    }
  }
}

return { done: false }
