import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getPreviewAfterLineNumber,
  getPreviewHeight,
  getPreviewLayout,
} from '../src/change-preview-widget'

test('anchors the preview at the clicked gutter line', () => {
  assert.equal(getPreviewAfterLineNumber(500, 1000), 499)
  assert.equal(getPreviewAfterLineNumber(1, 1000), 0)
  assert.equal(getPreviewAfterLineNumber(1200, 1000), 1000)
})

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

test('adds consumed horizontal scrollbar space to the view zone height', () => {
  assert.equal(getPreviewHeight(2), 70)
  assert.equal(getPreviewHeight(2, { horizontalScrollbarHeight: 10 }), 80)
})

test('grows wrapped content up to the six-row preview limit', () => {
  assert.equal(getPreviewHeight(1, { wrappedContentHeight: 80 }), 110)
  assert.equal(getPreviewHeight(1, { wrappedContentHeight: 200 }), 150)
})
