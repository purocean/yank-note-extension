const { res } = data

const obj = await res.json()

// Validate response structure
if (!obj || !obj.content || !Array.isArray(obj.content) || obj.content.length === 0) {
  throw new Error('Invalid response format from Anthropic API')
}

const text = obj.content[0].text
return [text]
