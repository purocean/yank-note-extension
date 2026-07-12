import assert from 'node:assert/strict'
import test from 'node:test'
import { getPreviewLayout } from '../src/change-preview-widget'

test('does not enable vertical scrolling for short previews', () => {
  assert.deepEqual(getPreviewLayout(1, 0), {
    visibleRows: 1,
    scrollable: false,
  })
  assert.deepEqual(getPreviewLayout(3, 3), {
    visibleRows: 6,
    scrollable: false,
  })
})

test('limits preview height to six rows and enables scrolling for overflow', () => {
  assert.deepEqual(getPreviewLayout(4, 3), {
    visibleRows: 6,
    scrollable: true,
  })
  assert.deepEqual(getPreviewLayout(101, 0), {
    visibleRows: 6,
    scrollable: true,
  })
})
