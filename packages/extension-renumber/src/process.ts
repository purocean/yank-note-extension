export function process (text: string): string {
  const lines = text.split('\n')
  const levelNumbers = {}
  const result: string[] = []

  lines.forEach(line => {
    const match = line.match(/^(\s*)(\d+)\.(.*)/)
    if (match) {
      const [, indent, , content] = match
      const level = indent.length // Use the raw length of leading whitespace for level

      // If this level has not been encountered before, initialize it
      if (!levelNumbers[level]) {
        levelNumbers[level] = 1
      } else {
        levelNumbers[level]++
      }

      // Reset levels deeper than the current one
      for (const key in levelNumbers) {
        if (parseInt(key) > level) {
          delete levelNumbers[key]
        }
      }

      // Form the renumbered line
      result.push(`${indent}${levelNumbers[level]}.${content}`)
    } else {
      // If line doesn't match a list item, keep it as is
      result.push(line)
    }
  })

  return result.join('\n')
}
