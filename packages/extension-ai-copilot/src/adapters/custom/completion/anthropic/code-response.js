const { res } = data

const obj = await res.json()
const text = obj.content[0].text
return [text]
