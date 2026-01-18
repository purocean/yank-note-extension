const { res } = data

if (!res || res.trim() === '') {
  return { done: false }
}

const MESSAGE_STOP_EVENT = 'event: message_stop'
const CONTENT_BLOCK_DELTA = 'content_block_delta'
const TEXT_DELTA = 'text_delta'

const lines = res.trim().split('\n')
const lastLine = lines[lines.length - 1]

if (lastLine === MESSAGE_STOP_EVENT) {
  return { done: true }
}

// Parse data lines
for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i]
  if (line.startsWith('data: ')) {
    try {
      const payload = JSON.parse(line.substring(6))
      
      if (payload.type === CONTENT_BLOCK_DELTA && payload.delta?.type === TEXT_DELTA) {
        return { delta: payload.delta.text }
      }
    } catch (error) {
      // Ignore malformed JSON and continue parsing other lines
      continue
    }
  }
}

return { done: false }
