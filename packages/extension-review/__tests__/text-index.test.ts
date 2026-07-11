import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { createReviewLocator } from '../src/locator'
import { RenderedTextIndex } from '../src/text-index'

function createView (html: string) {
  const dom = new JSDOM(`<div id="view">${html}</div>`)
  return dom.window.document.getElementById('view') as HTMLElement
}

test('element boundaries map to rendered offsets', () => {
  const view = createView('<p>hello <strong>world</strong></p><p>next</p>')
  const paragraph = view.firstElementChild!
  const range = view.ownerDocument.createRange()
  range.setStart(paragraph, 1)
  range.setEnd(paragraph, 2)

  const index = new RenderedTextIndex(view)
  const anchor = index.createAnchor(range)
  assert.equal(anchor?.exact, 'world')
})

test('long selections retain 128 characters at each edge', () => {
  const selected = 'a'.repeat(300)
  const view = createView(`<p>${selected}</p>`)
  const text = view.querySelector('p')!.firstChild!
  const range = view.ownerDocument.createRange()
  range.setStart(text, 0)
  range.setEnd(text, selected.length)

  const anchor = new RenderedTextIndex(view).createAnchor(range)
  assert.equal(anchor?.exact, undefined)
  assert.equal(anchor?.head?.length, 128)
  assert.equal(anchor?.tail?.length, 128)
  assert.equal(anchor?.omittedChars, 44)
})

test('locator recovers a selection after nearby content changes', () => {
  const originalView = createView('<p>前文 Alpha， Beta 后文</p>')
  const originalText = originalView.querySelector('p')!.firstChild!
  const range = originalView.ownerDocument.createRange()
  range.setStart(originalText, 3)
  range.setEnd(originalText, 14)
  const anchor = new RenderedTextIndex(originalView).createAnchor(range)!

  const updatedView = createView('<p>新增内容\n前文 alpha,   beta 后文</p>')
  const updatedIndex = new RenderedTextIndex(updatedView)
  const location = createReviewLocator(updatedIndex)(anchor)

  assert.ok(location)
  assert.equal(updatedIndex.text.slice(location.start, location.end), 'alpha,   beta')
})
