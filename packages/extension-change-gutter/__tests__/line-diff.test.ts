import assert from 'node:assert/strict'
import test from 'node:test'
import { computeLineChanges, defaultLineDiffLimits } from '../src/line-diff'

test('detects added, modified, and deleted lines with current line numbers', () => {
  assert.deepEqual(computeLineChanges('a\nc', 'a\nb\nc').changes.map(change => ({
    type: change.type,
    start: change.startLine,
    end: change.endLine,
  })), [
    { type: 'added', start: 2, end: 2 },
  ])

  assert.deepEqual(computeLineChanges('a\nb\nc', 'a\nx\nc').changes.map(change => ({
    type: change.type,
    start: change.startLine,
  })), [
    { type: 'modified', start: 2 },
  ])

  const deletion = computeLineChanges('a\nb\nc', 'a\nc')
  assert.deepEqual(deletion.changes.map(change => ({
    type: change.type,
    start: change.startLine,
  })), [
    { type: 'deleted', start: 2 },
  ])
  assert.deepEqual(deletion.hunks[0].originalLines, ['b'])
})

test('splits uneven replacement blocks into modified and deleted portions', () => {
  const result = computeLineChanges('a\nb\nc\nd\nz', 'a\nx\ny\nz')
  assert.equal(result.skipped, false)
  assert.deepEqual(result.changes.map(change => ({
    type: change.type,
    start: change.startLine,
    end: change.endLine,
  })), [
    { type: 'modified', start: 2, end: 3 },
    { type: 'deleted', start: 4, end: 4 },
  ])
  assert.deepEqual(result.hunks, [{
    id: '2:2:3:2',
    originalStartLine: 2,
    currentStartLine: 2,
    originalLines: ['b', 'c', 'd'],
    currentLines: ['x', 'y'],
  }])
})

test('keeps replacements aligned when adjacent lines have duplicate content', () => {
  const original = [
    'BEGIN long unique',
    'z',
    'x',
    'x',
    'same',
    'z',
    '*',
    'END long unique',
  ].join('\n')
  const modified = [
    'BEGIN long unique',
    'z',
    'replacement alpha long',
    'x',
    'same',
    'z',
    'replacement beta long',
    'END long unique',
  ].join('\n')

  const result = computeLineChanges(original, modified)
  assert.deepEqual(result.hunks.map(hunk => ({
    originalStartLine: hunk.originalStartLine,
    currentStartLine: hunk.currentStartLine,
    originalLines: hunk.originalLines,
    currentLines: hunk.currentLines,
  })), [
    {
      originalStartLine: 3,
      currentStartLine: 3,
      originalLines: ['x'],
      currentLines: ['replacement alpha long'],
    },
    {
      originalStartLine: 7,
      currentStartLine: 7,
      originalLines: ['*'],
      currentLines: ['replacement beta long'],
    },
  ])
})

test('normalizes line endings and avoids false changes', () => {
  const result = computeLineChanges('a\r\nb\r\n', 'a\nb\n')
  assert.equal(result.skipped, false)
  assert.deepEqual(result.changes, [])
})

test('does not decorate the synthetic empty line after a final newline', () => {
  const result = computeLineChanges('', 'a\n')
  assert.deepEqual(result.changes.map(change => ({
    type: change.type,
    start: change.startLine,
    end: change.endLine,
  })), [
    { type: 'added', start: 1, end: 1 },
  ])
})

test('trims common context before applying changed-line limits', () => {
  const prefix = Array.from({ length: 200 }, (_, index) => `before-${index}`)
  const suffix = Array.from({ length: 200 }, (_, index) => `after-${index}`)
  const original = [...prefix, 'old', ...suffix].join('\n')
  const modified = [...prefix, 'new', ...suffix].join('\n')
  const result = computeLineChanges(original, modified, {
    ...defaultLineDiffLimits,
    maxChangedLines: 1,
  })

  assert.equal(result.skipped, false)
  assert.equal(result.changes.length, 1)
  assert.equal(result.changes[0].startLine, 201)
})

test('skips documents over the configured performance budget', () => {
  const result = computeLineChanges('ab', 'ac', {
    ...defaultLineDiffLimits,
    maxDocumentChars: 1,
  })
  assert.equal(result.skipped, true)
  assert.deepEqual(result.hunks, [])
  assert.deepEqual(result.changes, [])
})
