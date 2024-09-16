const { res } = data

const obj = await res.json()
const text = obj.data.outputs.text
return [text]
