const { res } = data

const obj = await res.json()
const text = obj.choices[0].message.content
return [text]
