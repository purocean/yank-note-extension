import type { ChangeHunk } from './types'

interface ParsedContent {
  lines: string[]
  hasTrailingLineBreak: boolean
}

export interface MinimalTextEdit {
  startOffset: number
  endOffset: number
  text: string
}

function parseContent (content: string): ParsedContent {
  if (!content) {
    return { lines: [], hasTrailingLineBreak: false }
  }

  let normalized = content.replace(/\r\n?|\n/g, '\n')
  const hasTrailingLineBreak = normalized.endsWith('\n')
  if (hasTrailingLineBreak) {
    normalized = normalized.slice(0, -1)
  }

  return {
    lines: normalized.split('\n'),
    hasTrailingLineBreak,
  }
}

function arraysEqual (left: string[], right: string[]) {
  return left.length === right.length && left.every((line, index) => line === right[index])
}

export function restoreHunkContent (content: string, hunk: ChangeHunk, eol: string) {
  const parsed = parseContent(content)
  const startIndex = hunk.currentStartLine - 1
  if (startIndex < 0 || startIndex > parsed.lines.length) {
    return null
  }

  const currentLines = parsed.lines.slice(startIndex, startIndex + hunk.currentLines.length)
  if (!arraysEqual(currentLines, hunk.currentLines)) {
    return null
  }

  const lines = parsed.lines.slice()
  lines.splice(startIndex, hunk.currentLines.length, ...hunk.originalLines)
  if (!lines.length) {
    return ''
  }

  return lines.join(eol) + (parsed.hasTrailingLineBreak ? eol : '')
}

export function createMinimalTextEdit (content: string, nextContent: string): MinimalTextEdit | null {
  if (content === nextContent) {
    return null
  }

  const sharedLength = Math.min(content.length, nextContent.length)
  let startOffset = 0
  while (startOffset < sharedLength && content[startOffset] === nextContent[startOffset]) {
    startOffset++
  }

  let endOffset = content.length
  let nextEndOffset = nextContent.length
  while (
    endOffset > startOffset &&
    nextEndOffset > startOffset &&
    content[endOffset - 1] === nextContent[nextEndOffset - 1]
  ) {
    endOffset--
    nextEndOffset--
  }

  return {
    startOffset,
    endOffset,
    text: nextContent.slice(startOffset, nextEndOffset),
  }
}
