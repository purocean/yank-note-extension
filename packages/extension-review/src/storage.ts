import type { ReviewAnchor, ReviewLabels, ReviewSourceBlock } from './types'

const REVIEW_ID_PREFIX = 'yn-review-'
const LOCATOR_CLASSES = [
  'yn-review-prefix',
  'yn-review-exact',
  'yn-review-head',
  'yn-review-omitted',
  'yn-review-tail',
  'yn-review-suffix',
  'yn-review-comment',
] as const

interface SourceLine {
  text: string
  start: number
  end: number
  fullEnd: number
}

type LocatorClass = typeof LOCATOR_CLASSES[number]

export function createReviewId () {
  const random = Math.random().toString(36).slice(2, 7)
  return REVIEW_ID_PREFIX + Date.now().toString(36) + random
}

export function parseReviewBlocks (source: string): ReviewSourceBlock[] {
  const lines = splitLines(source)
  const result: ReviewSourceBlock[] = []

  for (let i = 0; i < lines.length; i++) {
    const opening = /^(:{3,})\s+section\b.*\{([^}]*)\}\s*$/.exec(lines[i].text.replace(/\s+$/, ''))
    if (!opening) {
      continue
    }

    const id = /#(yn-review-[A-Za-z0-9_-]+)/.exec(opening[2])?.[1]
    if (!id) {
      continue
    }

    const fenceLength = opening[1].length
    let closeLine = -1
    for (let j = i + 1; j < lines.length; j++) {
      const closing = /^(:{3,})\s*$/.exec(lines[j].text)
      if (closing && closing[1].length >= fenceLength) {
        closeLine = j
        break
      }
    }

    if (closeLine < 0) {
      continue
    }

    const renderedRange = readRangeAttribute(opening[2], 'data-rendered-range') || { start: 0, end: 0 }
    const sourceLines = readRangeAttribute(opening[2], 'data-source-lines')
    const markerValues = new Map<LocatorClass, string>()
    const markerAttrs = new Map<LocatorClass, string>()

    LOCATOR_CLASSES.forEach(className => {
      const marker = className === 'yn-review-comment'
        ? readMarkedContent(lines, i + 1, closeLine, className)
        : readMarkedBlockquote(lines, i + 1, closeLine, className)
      if (marker) {
        markerValues.set(className, marker.value)
        markerAttrs.set(className, marker.attrs)
      }
    })

    const omittedAttrs = markerAttrs.get('yn-review-omitted') || ''
    const omittedChars = Number.parseInt(readAttribute(omittedAttrs, 'data-chars') || '', 10) || undefined
    const anchor: ReviewAnchor = {
      renderedStart: renderedRange.start,
      renderedEnd: renderedRange.end,
      sourceLineStart: sourceLines?.start,
      sourceLineEnd: sourceLines?.end,
      prefix: decodeLocatorText(markerValues.get('yn-review-prefix') || ''),
      suffix: decodeLocatorText(markerValues.get('yn-review-suffix') || ''),
      exact: decodeOptional(markerValues.get('yn-review-exact')),
      head: decodeOptional(markerValues.get('yn-review-head')),
      tail: decodeOptional(markerValues.get('yn-review-tail')),
      omittedChars,
    }

    result.push({
      id,
      start: lines[i].start,
      end: lines[closeLine].fullEnd,
      anchor,
      comment: decodeCommentText(markerValues.get('yn-review-comment') || ''),
    })
    i = closeLine
  }

  return result
}

export function renderReviewBlock (id: string, anchor: ReviewAnchor, comment: string, labels: ReviewLabels) {
  const sourceLines = anchor.sourceLineStart && anchor.sourceLineEnd
    ? ` data-source-lines="${anchor.sourceLineStart}:${anchor.sourceLineEnd}"`
    : ''
  const displayId = id.startsWith(REVIEW_ID_PREFIX) ? id.slice(REVIEW_ID_PREFIX.length) : id
  const lines: string[] = [
    `:::: section ${labels.reviewTitle} · ${displayId} {#${id} data-rendered-range="${anchor.renderedStart}:${anchor.renderedEnd}"${sourceLines}}`,
    '::: details 上下文',
  ]

  appendLocator(lines, anchor.prefix, 'yn-review-prefix')

  if (anchor.exact !== undefined) {
    appendLocator(lines, anchor.exact, 'yn-review-exact')
  } else {
    appendLocator(lines, anchor.head || '', 'yn-review-head')
    if (anchor.omittedChars) {
      lines.push(
        quoteMarkdown(`*${labels.omitted(anchor.omittedChars)}*`),
        `{.yn-review-omitted data-chars="${anchor.omittedChars}"}`,
        ''
      )
    }
    appendLocator(lines, anchor.tail || '', 'yn-review-tail')
  }

  appendLocator(lines, anchor.suffix, 'yn-review-suffix')
  while (lines[lines.length - 1] === '') {
    lines.pop()
  }

  lines.push(
    ':::',
    '::: tip {.yn-review-comment}',
    escapeCommentText(comment),
    ':::',
    '::::'
  )

  return lines.join('\n')
}

export function insertReviewBlock (source: string, block: string, positions: ReadonlyMap<string, number>) {
  const content = source.replace(/\s+$/, '')
  const currentBlocks = parseReviewBlocks(source)
  if (currentBlocks.length === 0) {
    const prefix = content ? '\n\n---\n\n' : ''
    return content + prefix + block + '\n'
  }

  const newBlock = parseReviewBlocks(block)[0]
  if (!newBlock) {
    return content + '\n\n' + block + '\n'
  }

  const entries = currentBlocks.map((current, index) => ({
    source: source.slice(current.start, current.end).trimEnd(),
    review: current,
    index,
  }))
  entries.push({ source: block.trim(), review: newBlock, index: entries.length })
  entries.sort((a, b) => {
    const aPosition = positions.get(a.review.id) ?? a.review.anchor.renderedStart
    const bPosition = positions.get(b.review.id) ?? b.review.anchor.renderedStart
    return aPosition - bPosition ||
      a.review.anchor.renderedEnd - b.review.anchor.renderedEnd ||
      a.index - b.index
  })

  const hasOnlyReviewBlocks = currentBlocks.every((current, index) => {
    const next = currentBlocks[index + 1]
    return !next || !source.slice(current.end, next.start).trim()
  })
  if (!hasOnlyReviewBlocks) {
    const newPosition = positions.get(newBlock.id) ?? newBlock.anchor.renderedStart
    const insertBefore = currentBlocks.find(current => {
      const currentPosition = positions.get(current.id) ?? current.anchor.renderedStart
      return newPosition < currentPosition ||
        (newPosition === currentPosition && newBlock.anchor.renderedEnd < current.anchor.renderedEnd)
    })
    if (insertBefore) {
      return insertBlockAt(source, block, insertBefore.start)
    }
    return content + '\n\n' + block.trim() + '\n'
  }

  const regionStart = currentBlocks[0].start
  const regionEnd = currentBlocks[currentBlocks.length - 1].end
  const before = source.slice(0, regionStart)
  const after = source.slice(regionEnd)
  let trailingLineBreak = ''
  if (after && !after.startsWith('\n')) {
    trailingLineBreak = '\n'
  } else if (!after && source.endsWith('\n')) {
    trailingLineBreak = '\n'
  }
  return before + entries.map(entry => entry.source).join('\n\n') + trailingLineBreak + after
}

export function replaceReviewBlock (source: string, current: ReviewSourceBlock, replacement: string) {
  const before = source.slice(0, current.start)
  const after = source.slice(current.end)
  const keepLineBreak = current.end < source.length || source.endsWith('\n')
  return before + replacement + (keepLineBreak ? '\n' : '') + after
}

export function deleteReviewBlock (source: string, current: ReviewSourceBlock) {
  let before = source.slice(0, current.start)
  const after = source.slice(current.end)
  let result = before + after
  if (parseReviewBlocks(result).length === 0) {
    const separator = /(?:^|\n)[ \t]*---[ \t]*\n*$/.exec(before)
    if (separator) {
      before = before.slice(0, separator.index)
      result = before + after
    }
  }
  return result.replace(/\n{3,}$/g, '\n')
}

function appendLocator (lines: string[], value: string, className: string) {
  if (!value) {
    return
  }
  lines.push(
    quoteMarkdown(escapeLocatorText(value)),
    `{.${className}}`,
    ''
  )
}

function quoteMarkdown (value: string) {
  const lines = value.replace(/\r\n/g, '\n').split('\n')
  return lines.map(line => line ? `> ${line}` : '>').join('\n')
}

function escapeLocatorText (value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/([\\`*_[\]{}()#+\-.!|>~<>])/g, '\\$1')
}

function decodeLocatorText (value: string) {
  return value
    .replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function decodeOptional (value?: string) {
  return value === undefined ? undefined : decodeLocatorText(value)
}

function escapeCommentText (value: string) {
  return value.replace(/^([ \t]*)(\\*)(:{3,})(?=[ \t]|$)/gm, '$1\\$2$3')
}

function decodeCommentText (value: string) {
  return value.replace(/^([ \t]*)\\(\\*)(:{3,})(?=[ \t]|$)/gm, '$1$2$3')
}

function readMarkedBlockquote (lines: SourceLine[], start: number, end: number, className: LocatorClass) {
  for (let i = start; i < end; i++) {
    const attrs = readClassAttributeLine(lines[i].text, className)
    if (!attrs) {
      continue
    }

    let quoteEnd = i - 1
    while (quoteEnd >= start && !lines[quoteEnd].text.trim()) {
      quoteEnd--
    }
    if (quoteEnd < start || !/^\s*>/.test(lines[quoteEnd].text)) {
      continue
    }

    let quoteStart = quoteEnd
    while (quoteStart - 1 >= start && /^\s*>/.test(lines[quoteStart - 1].text)) {
      quoteStart--
    }

    const value = lines
      .slice(quoteStart, quoteEnd + 1)
      .map(line => line.text.replace(/^\s*> ?/, ''))
      .join('\n')

    return { value, attrs }
  }
  return null
}

function readMarkedContent (lines: SourceLine[], start: number, end: number, className: LocatorClass) {
  let containerStart = -1
  let attrs = ''
  for (let i = start; i < end; i++) {
    const opening = /^:{3}\s+tip\s+(\{[^{}]*\})\s*$/.exec(lines[i].text.trim())
    const openingAttrs = opening && readClassAttributeLine(opening[1], className)
    if (openingAttrs) {
      containerStart = i
      attrs = openingAttrs
      break
    }
  }

  if (containerStart < 0) {
    return null
  }

  let containerEnd = containerStart + 1
  while (containerEnd < end && !/^:{3}\s*$/.test(lines[containerEnd].text.trim())) {
    containerEnd++
  }
  if (containerEnd >= end) {
    return null
  }

  let contentStart = containerStart + 1
  let contentEnd = containerEnd
  while (contentStart < contentEnd && !lines[contentStart].text.trim()) {
    contentStart++
  }
  while (contentEnd > contentStart && !lines[contentEnd - 1].text.trim()) {
    contentEnd--
  }

  return {
    value: lines.slice(contentStart, contentEnd).map(line => line.text).join('\n'),
    attrs,
  }
}

function readClassAttributeLine (line: string, className: LocatorClass) {
  const match = /^\{([^{}]*)\}$/.exec(line.trim())
  if (!match) {
    return null
  }
  const classPattern = new RegExp(`(?:^|\\s)\\.${escapeRegExp(className)}(?=\\s|$)`)
  return classPattern.test(match[1]) ? match[1] : null
}

function insertBlockAt (source: string, block: string, offset: number) {
  const before = source.slice(0, offset)
  const after = source.slice(offset)
  const separator = before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  return before + separator + block.trim() + '\n\n' + after
}

function readRangeAttribute (attrs: string, name: string) {
  const value = readAttribute(attrs, name)
  const match = value && /^(\d+):(\d+)$/.exec(value)
  return match ? { start: Number.parseInt(match[1], 10), end: Number.parseInt(match[2], 10) } : null
}

function readAttribute (attrs: string, name: string) {
  return new RegExp(`${escapeRegExp(name)}="([^"]*)"`).exec(attrs)?.[1]
}

function splitLines (source: string): SourceLine[] {
  const rawLines = source.split('\n')
  let offset = 0
  return rawLines.map((rawLine, index) => {
    const text = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
    const line = {
      text,
      start: offset,
      end: offset + rawLine.length,
      fullEnd: offset + rawLine.length + (index < rawLines.length - 1 ? 1 : 0),
    }
    offset = line.fullEnd
    return line
  })
}

function escapeRegExp (value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
