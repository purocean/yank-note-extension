export type BaselineSource = 'git' | 'tab' | 'manual'
export type GitFileState = 'tracked' | 'new'
export type ChangeType = 'added' | 'modified' | 'deleted'

export interface ChangeBaseline {
  source: BaselineSource
  content: string
  revision?: string | null
  fileState?: GitFileState
}

export interface BaselineEntry {
  tabContent: string
  baseline: ChangeBaseline
  gitCheckedAt?: number
  gitRequestId?: number
}

export interface GitBaselineRequest {
  absolutePath: string
  knownRevision?: string | null
}

export type GitBaselineResult =
  | {
      source: 'git'
      content: string | null
      revision: string | null
      fileState: GitFileState
      unchanged?: boolean
    }
  | {
      source: 'none'
    }

export interface ChangeHunk {
  id: string
  originalStartLine: number
  currentStartLine: number
  originalLines: string[]
  currentLines: string[]
}

export interface LineChange {
  hunkId: string
  type: ChangeType
  startLine: number
  endLine: number
}

export interface LineDiffResult {
  hunks: ChangeHunk[]
  changes: LineChange[]
  skipped: boolean
}

export type DecorationLabels = Record<BaselineSource, Record<ChangeType, string>>

export interface ChangePreviewLabels {
  sourceTitles: Record<BaselineSource, string>
  setBaseline: string
  setBaselineTitle: string
  refreshBaseline: string
  refreshBaselineTitle: string
  restore: string
  history: string
  wordWrap: string
  close: string
  truncated: string
}

export interface ChangeGutterLabels {
  decorations: DecorationLabels
  preview: ChangePreviewLabels
}
