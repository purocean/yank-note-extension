export interface ReviewAnchor {
  renderedStart: number
  renderedEnd: number
  sourceLineStart?: number
  sourceLineEnd?: number
  prefix: string
  suffix: string
  exact?: string
  head?: string
  tail?: string
  omittedChars?: number
}

export interface ReviewSourceBlock {
  id: string
  start: number
  end: number
  anchor: ReviewAnchor
  comment: string
}

export interface ResolvedLocation {
  start: number
  end: number
  range: Range
  confidence: 'position' | 'exact' | 'context'
}

export interface ResolvedReview extends ReviewSourceBlock {
  root: HTMLElement | null
  location: ResolvedLocation | null
}

export interface ReviewLabels {
  reviewTitle: string
  omitted: (chars: number) => string
}
