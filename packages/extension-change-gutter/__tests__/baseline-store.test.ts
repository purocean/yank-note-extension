import assert from 'node:assert/strict'
import test from 'node:test'
import { BaselineStore } from '../src/baseline-store'
import type { GitBaselineResult } from '../src/types'

function beginGitCheck (store: BaselineStore, uri: string) {
  const requestId = store.beginGitCheck(uri)
  assert.equal(typeof requestId, 'number')
  return requestId as number
}

function applyGitResult (
  store: BaselineStore,
  uri: string,
  result: GitBaselineResult,
  checkedAt: number
) {
  return store.applyGitResult(uri, beginGitCheck(store, uri), result, checkedAt)
}

test('keeps the first tab baseline until the tab is removed', () => {
  const store = new BaselineStore()
  assert.deepEqual(store.ensureTab('a', 'opened'), { source: 'tab', content: 'opened' })
  assert.deepEqual(store.ensureTab('a', 'later'), { source: 'tab', content: 'opened' })

  store.retain(['b'])
  assert.equal(store.get('a'), undefined)
  assert.deepEqual(store.ensureTab('a', 'reopened'), { source: 'tab', content: 'reopened' })
})

test('replaces a tab baseline with Git and reuses unchanged Git content', () => {
  const store = new BaselineStore()
  store.ensureTab('a', 'opened')
  applyGitResult(store, 'a', {
    source: 'git',
    content: 'head',
    revision: 'r1',
    fileState: 'tracked',
  }, 100)

  const baseline = applyGitResult(store, 'a', {
    source: 'git',
    content: null,
    revision: 'r1',
    fileState: 'tracked',
    unchanged: true,
  }, 200)

  assert.deepEqual(baseline, {
    source: 'git',
    content: 'head',
    revision: 'r1',
    fileState: 'tracked',
  })
})

test('falls back from Git to the original tab snapshot', () => {
  const store = new BaselineStore()
  store.ensureTab('tab', 'opened')
  assert.deepEqual(applyGitResult(store, 'tab', { source: 'none' }, 100), {
    source: 'tab',
    content: 'opened',
  })

  store.ensureTab('git', 'opened')
  applyGitResult(store, 'git', {
    source: 'git',
    content: 'head',
    revision: 'r1',
    fileState: 'tracked',
  }, 100)
  assert.deepEqual(applyGitResult(store, 'git', { source: 'none' }, 200), {
    source: 'tab',
    content: 'opened',
  })
})

test('tracks Git freshness and prevents duplicate checks while one is pending', () => {
  const store = new BaselineStore()
  store.ensureTab('a', 'opened')

  assert.equal(store.shouldRefreshGit('a', 100, 30), true)
  const requestId = beginGitCheck(store, 'a')
  assert.equal(store.beginGitCheck('a'), undefined)
  assert.equal(store.shouldRefreshGit('a', 110, 30), false)

  store.finishGitCheck('a', requestId, 120)
  assert.equal(store.shouldRefreshGit('a', 149, 30), false)
  assert.equal(store.shouldRefreshGit('a', 150, 30), true)
})

test('pins a manual baseline and ignores later Git refreshes', () => {
  const store = new BaselineStore()
  store.ensureTab('a', 'opened')
  const requestId = beginGitCheck(store, 'a')
  assert.deepEqual(store.setManual('a', 'current'), {
    source: 'manual',
    content: 'current',
  })
  assert.equal(store.shouldRefreshGit('a', 100, 0), false)
  assert.equal(store.beginGitCheck('a'), undefined)

  store.applyGitResult('a', requestId, {
    source: 'git',
    content: 'head',
    revision: 'r1',
    fileState: 'tracked',
  }, 200)
  assert.deepEqual(store.get('a'), {
    source: 'manual',
    content: 'current',
  })

  store.retain([])
  assert.deepEqual(store.ensureTab('a', 'reopened'), {
    source: 'tab',
    content: 'reopened',
  })
})

test('resets manual or Git state to the original tab baseline for a forced refresh', () => {
  const store = new BaselineStore()
  store.ensureTab('a', 'opened')
  store.setManual('a', 'current')

  assert.deepEqual(store.resetForRefresh('a'), {
    source: 'tab',
    content: 'opened',
  })
  assert.equal(store.shouldRefreshGit('a', 100, 30000), true)
})

test('ignores an old Git result after the same URI is closed and reopened', () => {
  const store = new BaselineStore()
  store.ensureTab('a', 'first open')
  const oldRequestId = beginGitCheck(store, 'a')

  store.retain([])
  store.ensureTab('a', 'reopened')
  const newRequestId = beginGitCheck(store, 'a')
  store.finishGitCheck('a', oldRequestId, 90)
  assert.equal(store.beginGitCheck('a'), undefined)
  store.applyGitResult('a', oldRequestId, {
    source: 'git',
    content: 'stale head',
    revision: 'old',
    fileState: 'tracked',
  }, 100)

  assert.deepEqual(store.get('a'), { source: 'tab', content: 'reopened' })
  store.applyGitResult('a', newRequestId, {
    source: 'git',
    content: 'current head',
    revision: 'new',
    fileState: 'tracked',
  }, 200)
  assert.deepEqual(store.get('a'), {
    source: 'git',
    content: 'current head',
    revision: 'new',
    fileState: 'tracked',
  })
})
