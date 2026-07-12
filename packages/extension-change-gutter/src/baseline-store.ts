import type { BaselineEntry, ChangeBaseline, GitBaselineResult } from './types'

export class BaselineStore {
  private readonly values = new Map<string, BaselineEntry>()
  private nextGitRequestId = 0

  get (uri: string) {
    return this.values.get(uri)?.baseline
  }

  getEntry (uri: string) {
    return this.values.get(uri)
  }

  ensureTab (uri: string, content: string) {
    let entry = this.values.get(uri)
    if (!entry) {
      const baseline: ChangeBaseline = { source: 'tab', content }
      entry = {
        tabContent: content,
        baseline,
      }
      this.values.set(uri, entry)
    }
    return entry.baseline
  }

  shouldRefreshGit (uri: string, now: number, maxAge: number) {
    const entry = this.values.get(uri)
    return !!entry && entry.baseline.source !== 'manual' && entry.gitRequestId === undefined && (
      entry.gitCheckedAt === undefined || now - entry.gitCheckedAt >= maxAge
    )
  }

  beginGitCheck (uri: string) {
    const entry = this.values.get(uri)
    if (!entry || entry.baseline.source === 'manual' || entry.gitRequestId !== undefined) {
      return undefined
    }
    const requestId = ++this.nextGitRequestId
    entry.gitRequestId = requestId
    return requestId
  }

  finishGitCheck (uri: string, requestId: number, checkedAt: number) {
    const entry = this.values.get(uri)
    if (!entry || entry.gitRequestId !== requestId) {
      return
    }
    entry.gitRequestId = undefined
    entry.gitCheckedAt = checkedAt
  }

  applyGitResult (uri: string, requestId: number, result: GitBaselineResult, checkedAt: number) {
    const entry = this.values.get(uri)
    if (!entry || entry.gitRequestId !== requestId) {
      return undefined
    }

    entry.gitRequestId = undefined
    const current = entry.baseline
    entry.gitCheckedAt = checkedAt

    if (result.source === 'none') {
      entry.baseline = { source: 'tab', content: entry.tabContent }
      return entry.baseline
    }

    if (result.unchanged && current.source === 'git') {
      const baseline: ChangeBaseline = {
        ...current,
        revision: result.revision,
        fileState: result.fileState,
      }
      entry.baseline = baseline
      return baseline
    }

    const baseline: ChangeBaseline = {
      source: 'git',
      content: result.content || '',
      revision: result.revision,
      fileState: result.fileState,
    }
    entry.baseline = baseline
    return baseline
  }

  setManual (uri: string, content: string) {
    const entry = this.values.get(uri)
    if (!entry) {
      return undefined
    }
    entry.gitRequestId = undefined
    entry.baseline = { source: 'manual', content }
    return entry.baseline
  }

  resetForRefresh (uri: string) {
    const entry = this.values.get(uri)
    if (!entry || entry.gitRequestId !== undefined) {
      return undefined
    }
    entry.gitCheckedAt = undefined
    entry.baseline = { source: 'tab', content: entry.tabContent }
    return entry.baseline
  }

  retain (uris: Iterable<string>) {
    const retained = new Set(uris)
    for (const uri of this.values.keys()) {
      if (!retained.has(uri)) {
        this.values.delete(uri)
      }
    }
  }
}
