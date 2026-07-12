import assert from 'node:assert/strict'
import test from 'node:test'
import { createDecorationSpecs } from '../src/decorations'
import type { DecorationLabels, LineChange } from '../src/types'

const labels: DecorationLabels = {
  git: { added: 'git added', modified: 'git modified', deleted: 'git deleted' },
  tab: { added: 'tab added', modified: 'tab modified', deleted: 'tab deleted' },
  manual: { added: 'manual added', modified: 'manual modified', deleted: 'manual deleted' },
}

const changes: LineChange[] = [{
  hunkId: '2:2:2:3',
  type: 'modified',
  startLine: 2,
  endLine: 4,
}]

test('builds source-specific line decorations and tooltips', () => {
  const git = createDecorationSpecs(changes, 'git', labels)[0]
  assert.deepEqual(git.range, {
    startLineNumber: 2,
    startColumn: 1,
    endLineNumber: 4,
    endColumn: 1,
  })
  assert.equal(git.options.linesDecorationsClassName, 'yn-change-gutter yn-change-gutter-git-modified')
  assert.equal(git.options.linesDecorationsTooltip, 'git modified')

  const tab = createDecorationSpecs(changes, 'tab', labels)[0]
  assert.equal(tab.options.linesDecorationsClassName, 'yn-change-gutter yn-change-gutter-tab-modified')
  assert.equal(tab.options.linesDecorationsTooltip, 'tab modified')

  const manual = createDecorationSpecs(changes, 'manual', labels)[0]
  assert.equal(manual.options.linesDecorationsClassName, 'yn-change-gutter yn-change-gutter-manual-modified')
  assert.equal(manual.options.linesDecorationsTooltip, 'manual modified')
})
