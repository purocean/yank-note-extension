import { DefaultLinesDiffComputer } from 'vscode-diff'
import type { ChangeHunk, LineChange, LineDiffResult } from './types'

export interface LineDiffLimits {
  maxDocumentChars: number
  maxChangedLines: number
  maxComputationTimeMs: number
}

export const defaultLineDiffLimits: LineDiffLimits = {
  maxDocumentChars: 2 * 1024 * 1024,
  maxChangedLines: 10000,
  maxComputationTimeMs: 100,
}

interface DiffRange {
  originalStartLine: number
  originalEndLineExclusive: number
  currentStartLine: number
  currentEndLineExclusive: number
}

const diffComputer = new DefaultLinesDiffComputer()

function toLines (content: string) {
  if (!content) {
    return [] as string[]
  }
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  if (lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines
}

function computeDiffRanges (
  originalLines: string[],
  currentLines: string[],
  maxComputationTimeMs: number
): DiffRange[] | null {
  if (!originalLines.length || !currentLines.length) {
    return originalLines.length || currentLines.length
      ? [{
          originalStartLine: 1,
          originalEndLineExclusive: originalLines.length + 1,
          currentStartLine: 1,
          currentEndLineExclusive: currentLines.length + 1,
        }]
      : []
  }

  try {
    const result = diffComputer.computeDiff(originalLines, currentLines, {
      computeMoves: false,
      ignoreTrimWhitespace: false,
      maxComputationTimeMs,
    })
    if (result.hitTimeout) {
      return null
    }
    return result.changes.map(change => ({
      originalStartLine: change.original.startLineNumber,
      originalEndLineExclusive: change.original.endLineNumberExclusive,
      currentStartLine: change.modified.startLineNumber,
      currentEndLineExclusive: change.modified.endLineNumberExclusive,
    }))
  } catch {
    return null
  }
}

export function computeLineChanges (
  originalContent: string,
  modifiedContent: string,
  limits: LineDiffLimits = defaultLineDiffLimits
): LineDiffResult {
  if (originalContent === modifiedContent) {
    return { hunks: [], changes: [], skipped: false }
  }

  if (Math.max(originalContent.length, modifiedContent.length) > limits.maxDocumentChars) {
    return { hunks: [], changes: [], skipped: true }
  }

  const originalLines = toLines(originalContent)
  const modifiedLines = toLines(modifiedContent)
  let prefixLength = 0
  while (
    prefixLength < originalLines.length &&
    prefixLength < modifiedLines.length &&
    originalLines[prefixLength] === modifiedLines[prefixLength]
  ) {
    prefixLength++
  }

  let suffixLength = 0
  while (
    suffixLength < originalLines.length - prefixLength &&
    suffixLength < modifiedLines.length - prefixLength &&
    originalLines[originalLines.length - suffixLength - 1] === modifiedLines[modifiedLines.length - suffixLength - 1]
  ) {
    suffixLength++
  }

  const originalEnd = originalLines.length - suffixLength
  const modifiedEnd = modifiedLines.length - suffixLength
  const originalMiddle = originalLines.slice(prefixLength, originalEnd)
  const modifiedMiddle = modifiedLines.slice(prefixLength, modifiedEnd)

  if (Math.max(originalMiddle.length, modifiedMiddle.length) > limits.maxChangedLines) {
    return { hunks: [], changes: [], skipped: true }
  }

  const ranges = computeDiffRanges(
    originalMiddle,
    modifiedMiddle,
    limits.maxComputationTimeMs
  )
  if (!ranges) {
    return { hunks: [], changes: [], skipped: true }
  }

  const hunks: ChangeHunk[] = []
  const changes: LineChange[] = []
  const currentLineCount = Math.max(1, modifiedLines.length)
  for (const range of ranges) {
    const originalLine = prefixLength + range.originalStartLine
    const modifiedLine = prefixLength + range.currentStartLine
    const removedLines = originalMiddle.slice(
      range.originalStartLine - 1,
      range.originalEndLineExclusive - 1
    )
    const addedLines = modifiedMiddle.slice(
      range.currentStartLine - 1,
      range.currentEndLineExclusive - 1
    )

    const hunkId = `${originalLine}:${modifiedLine}:${removedLines.length}:${addedLines.length}`
    hunks.push({
      id: hunkId,
      originalStartLine: originalLine,
      currentStartLine: modifiedLine,
      originalLines: removedLines,
      currentLines: addedLines,
    })

    const paired = Math.min(removedLines.length, addedLines.length)
    if (paired > 0) {
      changes.push({
        hunkId,
        type: 'modified',
        startLine: modifiedLine,
        endLine: modifiedLine + paired - 1,
      })
    }

    if (addedLines.length > paired) {
      changes.push({
        hunkId,
        type: 'added',
        startLine: modifiedLine + paired,
        endLine: modifiedLine + addedLines.length - 1,
      })
    }

    if (removedLines.length > paired) {
      const anchorLine = Math.min(currentLineCount, Math.max(1, modifiedLine + paired))
      changes.push({
        hunkId,
        type: 'deleted',
        startLine: anchorLine,
        endLine: anchorLine,
      })
    }
  }

  return { hunks, changes, skipped: false }
}
