import assert from 'node:assert/strict'
import test from 'node:test'
import {
  insertReviewBlock,
  parseReviewBlocks,
  renderReviewBlock,
} from '../src/storage'
import type { ReviewAnchor } from '../src/types'

const labels = {
  reviewTitle: '批注',
  omitted: (chars: number) => `省略 ${chars} 字`,
}

function anchor (start: number, exact: string): ReviewAnchor {
  return {
    renderedStart: start,
    renderedEnd: start + exact.length,
    prefix: '前文',
    exact,
    suffix: '后文',
  }
}

test('review block preserves Markdown container-like comment lines', () => {
  const comment = [
    '普通评论',
    '  ::: tip',
    '\\::: 原本已有转义',
    '::::',
  ].join('\n')
  const block = renderReviewBlock('yn-review-roundtrip', anchor(10, '选择内容'), comment, labels)
  const parsed = parseReviewBlocks(block)

  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].comment, comment)
  assert.equal(parsed[0].anchor.exact, '选择内容')
})

test('marker names in quoted text are not treated as class attributes', () => {
  const source = [
    ':::: section 批注 · strict {#yn-review-strict data-rendered-range="1:2"}',
    '::: details 上下文',
    '> 普通内容包含 .yn-review-prefix',
    '{.unrelated}',
    ':::',
    '::: tip {.yn-review-comment}',
    '评论',
    ':::',
    '::::',
  ].join('\n')

  const parsed = parseReviewBlocks(source)
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].anchor.prefix, '')
})

test('inserting into a continuous review area sorts comments by rendered position', () => {
  const first = renderReviewBlock('yn-review-first', anchor(100, '后'), 'first', labels)
  const second = renderReviewBlock('yn-review-second', anchor(20, '前'), 'second', labels)
  const source = `正文\n\n---\n\n${first}\n`
  const result = insertReviewBlock(source, second, new Map([
    ['yn-review-first', 100],
    ['yn-review-second', 20],
  ]))

  assert.deepEqual(parseReviewBlocks(result).map(block => block.id), [
    'yn-review-second',
    'yn-review-first',
  ])
})

test('inserting never drops non-review content between existing comments', () => {
  const first = renderReviewBlock('yn-review-first', anchor(10, '一'), 'first', labels)
  const last = renderReviewBlock('yn-review-last', anchor(30, '三'), 'last', labels)
  const middle = renderReviewBlock('yn-review-middle', anchor(20, '二'), 'middle', labels)
  const source = `正文\n\n---\n\n${first}\n\n这段是用户或 AI 插入的普通文字\n\n${last}\n`
  const result = insertReviewBlock(source, middle, new Map([
    ['yn-review-first', 10],
    ['yn-review-middle', 20],
    ['yn-review-last', 30],
  ]))

  assert.match(result, /这段是用户或 AI 插入的普通文字/)
  assert.deepEqual(parseReviewBlocks(result).map(block => block.id), [
    'yn-review-first',
    'yn-review-middle',
    'yn-review-last',
  ])
})
