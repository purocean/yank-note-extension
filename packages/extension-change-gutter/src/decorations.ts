import type { editor } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import type { BaselineSource, DecorationLabels, LineChange } from './types'

export function createDecorationSpecs (
  changes: LineChange[],
  source: BaselineSource,
  labels: DecorationLabels
): editor.IModelDeltaDecoration[] {
  return changes.map(change => ({
    range: {
      startLineNumber: change.startLine,
      startColumn: 1,
      endLineNumber: change.endLine,
      endColumn: 1,
    },
    options: {
      isWholeLine: true,
      linesDecorationsClassName: `yn-change-gutter yn-change-gutter-${source}-${change.type}`,
      linesDecorationsTooltip: labels[source][change.type],
    },
  }))
}
