const { res } = data

if (res.headers.get('Content-Type').startsWith('image')) {
  return { blob: await res.blob() }
} else {
  throw new Error(await res.text())
}
