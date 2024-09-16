const { res, sse } = data

if (sse) { // SSE message, res is a string
  if (res === '[DONE]') {
    return { done: true }
  }

  const payload = JSON.parse(res)
  const delta = payload.response

  return { delta }
} else { // normal response, res is a Response object
  const obj = await res.json()
  const text = obj.result.response
  return { text }
}
