import assert from 'node:assert/strict'
import test from 'node:test'
import { computeLineChanges } from '../src/line-diff'
import { createMinimalTextEdit, restoreHunkContent } from '../src/restore-change'

function restoreOnlyHunk (original: string, current: string, eol = '\n') {
  const result = computeLineChanges(original, current)
  assert.equal(result.hunks.length, 1)
  return restoreHunkContent(current, result.hunks[0], eol)
}

test('restores added, removed, and modified line blocks', () => {
  assert.equal(restoreOnlyHunk('a\nc', 'a\nb\nc'), 'a\nc')
  assert.equal(restoreOnlyHunk('a\nb\nc', 'a\nc'), 'a\nb\nc')
  assert.equal(restoreOnlyHunk('a\nb\nc\nd\nz', 'a\nx\ny\nz'), 'a\nb\nc\nd\nz')
})

test('restores changes at file boundaries and preserves the current final line break', () => {
  assert.equal(restoreOnlyHunk('a', 'a\nb'), 'a')
  assert.equal(restoreOnlyHunk('a\n', 'a\nb\n'), 'a\n')
  assert.equal(restoreOnlyHunk('a\nb', 'a'), 'a\nb')
  assert.equal(restoreOnlyHunk('a\nb\n', 'a\n'), 'a\nb\n')
  assert.equal(restoreOnlyHunk('', 'new'), '')
  assert.equal(restoreOnlyHunk('a', 'changed\n'), 'a\n')
  assert.equal(restoreOnlyHunk('a\n', 'changed'), 'a')
})

test('uses the current model EOL when restoring lines', () => {
  assert.equal(restoreOnlyHunk('a\nb\nc\n', 'a\r\nx\r\nc\r\n', '\r\n'), 'a\r\nb\r\nc\r\n')
})

test('rejects a stale hunk after its current lines have changed', () => {
  const hunk = computeLineChanges('a\nb\nc', 'a\nx\nc').hunks[0]
  assert.equal(restoreHunkContent('a\ny\nc', hunk, '\n'), null)
})

test('restores one hunk without touching other changes', () => {
  const current = 'a\nx\nc\ny\ne'
  const result = computeLineChanges('a\nb\nc\nd\ne', current)
  assert.equal(result.hunks.length, 2)
  assert.equal(restoreHunkContent(current, result.hunks[0], '\n'), 'a\nb\nc\ny\ne')
})

test('creates the smallest edit needed to reach restored content', () => {
  assert.deepEqual(createMinimalTextEdit('before x after', 'before old after'), {
    startOffset: 7,
    endOffset: 8,
    text: 'old',
  })
  assert.equal(createMinimalTextEdit('same', 'same'), null)
})
