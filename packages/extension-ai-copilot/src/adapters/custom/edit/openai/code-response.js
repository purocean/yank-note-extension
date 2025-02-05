const { res } = data

if (res === '[DONE]') {
  return { done: true }
}

const payload = res ? JSON.parse(res) : null
const delta = payload?.choices[0]?.delta?.content
const thinkDelta = payload?.choices[0]?.delta?.reasoning_content

return { delta, thinkDelta }
