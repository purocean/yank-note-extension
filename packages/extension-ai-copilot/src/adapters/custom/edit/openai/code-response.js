const { res } = data

if (res === '[DONE]') {
  return { done: true }
}

const payload = JSON.parse(res)
const delta = payload?.choices[0]?.delta?.content

return { delta }
