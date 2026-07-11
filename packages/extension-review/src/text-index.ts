import type { ReviewAnchor } from './types'

const BLOCK_TAGS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DIV', 'DL', 'DT', 'DD',
  'FIGCAPTION', 'FIGURE', 'FOOTER', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HEADER', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION',
  'SUMMARY', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
])

const SKIP_SELECTOR = [
  '[id^="yn-review-"]',
  '.yn-review-floating-button',
  '.yn-review-composer',
  '.yn-review-actions',
  'script',
  'style',
  '[hidden]'
].join(',')

const EXACT_LIMIT = 256
const EDGE_LIMIT = 128
const CONTEXT_LIMIT = 80

interface TextSegment {
  node: Text
  start: number
  end: number
}

interface Boundary {
  node: Text
  offset: number
}

export class RenderedTextIndex {
  readonly root: HTMLElement
  readonly text: string
  private readonly segments: TextSegment[] = []
  private readonly segmentByNode = new Map<Text, TextSegment>()
  private readonly boundaryOffsetsByNode = new WeakMap<Node, number[]>()
  private buffer = ''

  constructor (root: HTMLElement) {
    this.root = root
    this.visit(root)
    this.text = this.buffer.replace(/\n+$/, '')
  }

  rangeToOffsets (range: Range) {
    const start = this.offsetForBoundary(range.startContainer, range.startOffset)
    const end = this.offsetForBoundary(range.endContainer, range.endOffset)

    if (start === null || end === null || end <= start) {
      return null
    }

    return { start, end }
  }

  rangeFromOffsets (start: number, end: number) {
    if (end <= start || this.segments.length === 0) {
      return null
    }

    const startBoundary = this.boundaryAt(start, 'start')
    const endBoundary = this.boundaryAt(end, 'end')
    if (!startBoundary || !endBoundary) {
      return null
    }

    const range = this.root.ownerDocument.createRange()
    range.setStart(startBoundary.node, startBoundary.offset)
    range.setEnd(endBoundary.node, endBoundary.offset)
    return range
  }

  offsetFromPoint (x: number, y: number) {
    const doc = this.root.ownerDocument as any
    const caret = doc.caretPositionFromPoint?.(x, y)
    if (caret) {
      return this.offsetForBoundary(caret.offsetNode, caret.offset)
    }

    const range = doc.caretRangeFromPoint?.(x, y) as Range | undefined
    if (range) {
      return this.offsetForBoundary(range.startContainer, range.startOffset)
    }

    return null
  }

  sourceLinesForRange (range: Range) {
    const startElement = this.getElement(range.startContainer)
    const endElement = this.getElement(range.endContainer)
    const startBlock = startElement?.closest<HTMLElement>('[data-source-line]')
    const endBlock = endElement?.closest<HTMLElement>('[data-source-line]')

    if (!startBlock && !endBlock) {
      return null
    }

    const startLine = this.readStartLine(startBlock || endBlock!)
    const endLine = this.readEndLine(endBlock || startBlock!)

    if (!startLine || !endLine) {
      return null
    }

    return {
      start: Math.min(startLine, endLine),
      end: Math.max(startLine, endLine),
    }
  }

  sourceLinesForOffsets (start: number, end: number) {
    const range = this.rangeFromOffsets(start, end)
    return range ? this.sourceLinesForRange(range) : null
  }

  createAnchor (range: Range): ReviewAnchor | null {
    const offsets = this.rangeToOffsets(range)
    if (!offsets) {
      return null
    }

    const selectedText = this.text.slice(offsets.start, offsets.end)
    if (!selectedText.trim()) {
      return null
    }

    const sourceLines = this.sourceLinesForRange(range)
    const anchor: ReviewAnchor = {
      renderedStart: offsets.start,
      renderedEnd: offsets.end,
      sourceLineStart: sourceLines?.start,
      sourceLineEnd: sourceLines?.end,
      prefix: this.text.slice(Math.max(0, offsets.start - CONTEXT_LIMIT), offsets.start),
      suffix: this.text.slice(offsets.end, offsets.end + CONTEXT_LIMIT),
    }

    if (selectedText.length <= EXACT_LIMIT) {
      anchor.exact = selectedText
    } else {
      anchor.head = selectedText.slice(0, EDGE_LIMIT)
      anchor.tail = selectedText.slice(-EDGE_LIMIT)
      anchor.omittedChars = Math.max(0, selectedText.length - EDGE_LIMIT * 2)
    }

    return anchor
  }

  private visit (node: Node) {
    if (node.nodeType === node.ELEMENT_NODE) {
      const element = node as HTMLElement
      if (element !== this.root && element.matches(SKIP_SELECTOR)) {
        return
      }

      if (element.tagName === 'BR') {
        this.appendSeparator()
        return
      }

      const isBlock = element !== this.root && BLOCK_TAGS.has(element.tagName)
      if (isBlock) {
        this.appendSeparator()
      }

      const boundaryOffsets = [this.buffer.length]
      element.childNodes.forEach(child => {
        this.visit(child)
        boundaryOffsets.push(this.buffer.length)
      })
      this.boundaryOffsetsByNode.set(element, boundaryOffsets)

      if (isBlock) {
        this.appendSeparator()
      }
      return
    }

    if (node.nodeType !== node.TEXT_NODE) {
      return
    }

    const textNode = node as Text
    const value = textNode.data.replace(/\u00a0/g, ' ')
    if (!value) {
      return
    }

    const segment = {
      node: textNode,
      start: this.buffer.length,
      end: this.buffer.length + value.length,
    }
    this.buffer += value
    this.segments.push(segment)
    this.segmentByNode.set(textNode, segment)
  }

  private appendSeparator () {
    if (this.buffer && !this.buffer.endsWith('\n')) {
      this.buffer += '\n'
    }
  }

  private offsetForBoundary (node: Node, offset: number): number | null {
    if (node.nodeType === node.TEXT_NODE) {
      const segment = this.segmentByNode.get(node as Text)
      if (!segment) {
        return null
      }
      return segment.start + Math.max(0, Math.min(offset, segment.end - segment.start))
    }

    const boundaryOffsets = this.boundaryOffsetsByNode.get(node)
    if (boundaryOffsets) {
      const boundary = boundaryOffsets[Math.max(0, Math.min(offset, boundaryOffsets.length - 1))]
      return Math.max(0, Math.min(boundary, this.text.length))
    }

    return null
  }

  private boundaryAt (offset: number, bias: 'start' | 'end'): Boundary | null {
    const clamped = Math.max(0, Math.min(offset, this.text.length))
    let low = 0
    let high = this.segments.length
    while (low < high) {
      const middle = (low + high) >>> 1
      if (this.segments[middle].end < clamped) {
        low = middle + 1
      } else {
        high = middle
      }
    }

    const segment = this.segments[low]
    if (segment && clamped >= segment.start) {
      return {
        node: segment.node,
        offset: Math.max(0, Math.min(clamped - segment.start, segment.end - segment.start)),
      }
    }

    if (segment) {
      if (bias === 'end' && low > 0) {
        const previous = this.segments[low - 1]
        return { node: previous.node, offset: previous.end - previous.start }
      }
      return { node: segment.node, offset: 0 }
    }

    const last = this.segments[this.segments.length - 1]
    return last ? { node: last.node, offset: last.end - last.start } : null
  }

  private getElement (node: Node) {
    return node.nodeType === node.ELEMENT_NODE ? node as Element : node.parentElement
  }

  private readStartLine (element: HTMLElement) {
    return Number.parseInt(element.dataset.sourceLine || '', 10) || 0
  }

  private readEndLine (element: HTMLElement) {
    const start = this.readStartLine(element)
    const exclusiveEnd = Number.parseInt(element.dataset.sourceLineEnd || '', 10)
    return exclusiveEnd ? Math.max(start, exclusiveEnd - 1) : start
  }
}
