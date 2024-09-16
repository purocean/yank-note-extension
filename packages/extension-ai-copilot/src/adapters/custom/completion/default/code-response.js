const { res } = data

const obj = await res.json()
const text = obj.result.response
return [text]
