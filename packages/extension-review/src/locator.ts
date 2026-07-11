import { RenderedTextIndex } from './text-index'
import type { ResolvedLocation, ReviewAnchor } from './types'

interface Candidate {
  start: number
  end: number
  score: number
  confidence: ResolvedLocation['confidence']
}

interface NormalizedText {
  text: string
  starts: number[]
  ends: number[]
}

const PUNCTUATION: Record<string, string> = {
  '，': ',',
  '。': '.',
  '；': ';',
  '：': ':',
  '“': '"',
  '”': '"',
  '‘': "'",
  '’': "'",
  '（': '(',
  '）': ')',
  '【': '[',
  '】': ']'
}

export function resolveReviewLocation (anchor: ReviewAnchor, index: RenderedTextIndex): ResolvedLocation | null {
  return resolveWithNormalizedText(anchor, index, normalizeWithMap(index.text))
}

export function createReviewLocator (index: RenderedTextIndex) {
  const normalized = normalizeWithMap(index.text)
  return (anchor: ReviewAnchor) => resolveWithNormalizedText(anchor, index, normalized)
}

function resolveWithNormalizedText (
  anchor: ReviewAnchor,
  index: RenderedTextIndex,
  normalized: NormalizedText
): ResolvedLocation | null {
  const fastCandidate = validatePosition(anchor, index)
  if (fastCandidate) {
    return toLocation(fastCandidate, index)
  }

  const candidates = anchor.exact
    ? findExactCandidates(anchor, index, normalized)
    : findBoundaryCandidates(anchor, index, normalized)

  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]
  const second = candidates[1]

  if (!best || best.score < 70 || (second && best.score - second.score < 8)) {
    return null
  }

  return toLocation(best, index)
}

function validatePosition (anchor: ReviewAnchor, index: RenderedTextIndex): Candidate | null {
  const { renderedStart: start, renderedEnd: end } = anchor
  if (start < 0 || end <= start || end > index.text.length) {
    return null
  }

  const selected = normalize(index.text.slice(start, end))
  if (anchor.exact && selected === normalize(anchor.exact)) {
    return { start, end, score: 200, confidence: 'position' }
  }

  if (anchor.head && anchor.tail) {
    const head = normalize(anchor.head)
    const tail = normalize(anchor.tail)
    if (selected.startsWith(head) && selected.endsWith(tail)) {
      return { start, end, score: 190, confidence: 'position' }
    }
  }

  return null
}

function findExactCandidates (anchor: ReviewAnchor, index: RenderedTextIndex, normalized: NormalizedText) {
  const needle = normalize(anchor.exact || '')
  return findMatches(normalized.text, needle).map(match => {
    const candidate = normalizedMatchToRaw(match, needle.length, normalized)
    return scoreCandidate(anchor, index, candidate.start, candidate.end, 110, 'exact')
  })
}

function findBoundaryCandidates (anchor: ReviewAnchor, index: RenderedTextIndex, normalized: NormalizedText) {
  const head = normalize(anchor.head || '')
  const tail = normalize(anchor.tail || '')
  if (!head || !tail) {
    return []
  }

  const headMatches = findMatches(normalized.text, head, 40)
  const tailMatches = findMatches(normalized.text, tail, 80)
  const expectedLength = Math.max(1, anchor.renderedEnd - anchor.renderedStart)
  const maxDistance = Math.max(expectedLength * 3, 12000)
  const candidates: Candidate[] = []

  headMatches.forEach(headMatch => {
    const possibleTails = tailMatches
      .filter(tailMatch => {
        return tailMatch >= headMatch + head.length && tailMatch - headMatch <= maxDistance
      })
      .sort((a, b) => {
        const aLengthDifference = Math.abs((a + tail.length - headMatch) - expectedLength)
        const bLengthDifference = Math.abs((b + tail.length - headMatch) - expectedLength)
        return aLengthDifference - bLengthDifference
      })

    possibleTails.slice(0, 8).forEach(tailMatch => {
      const start = normalized.starts[headMatch]
      const tailEndIndex = tailMatch + tail.length - 1
      const end = normalized.ends[tailEndIndex] ?? normalized.ends[normalized.ends.length - 1]
      candidates.push(scoreCandidate(anchor, index, start, end, 80, 'context'))
    })
  })

  return candidates
}

function scoreCandidate (
  anchor: ReviewAnchor,
  index: RenderedTextIndex,
  start: number,
  end: number,
  base: number,
  confidence: Candidate['confidence']
): Candidate {
  let score = base
  const startDistance = Math.abs(start - anchor.renderedStart)
  score += Math.max(0, 25 - startDistance / 80)

  const expectedLength = Math.max(1, anchor.renderedEnd - anchor.renderedStart)
  const lengthDifference = Math.abs((end - start) - expectedLength) / expectedLength
  score += Math.max(0, 20 - lengthDifference * 20)

  const prefix = normalize(anchor.prefix)
  const suffix = normalize(anchor.suffix)
  const before = normalize(index.text.slice(Math.max(0, start - anchor.prefix.length - 20), start))
  const after = normalize(index.text.slice(end, end + anchor.suffix.length + 20))
  if (prefix && before.endsWith(prefix)) {
    score += 25
  }
  if (suffix && after.startsWith(suffix)) {
    score += 25
  }

  const lines = index.sourceLinesForOffsets(start, end)
  if (lines && anchor.sourceLineStart && anchor.sourceLineEnd) {
    const distance = Math.abs(lines.start - anchor.sourceLineStart) + Math.abs(lines.end - anchor.sourceLineEnd)
    score += Math.max(0, 25 - distance * 3)
  }

  return { start, end, score, confidence }
}

function toLocation (candidate: Candidate, index: RenderedTextIndex): ResolvedLocation | null {
  const range = index.rangeFromOffsets(candidate.start, candidate.end)
  return range
    ? { start: candidate.start, end: candidate.end, range, confidence: candidate.confidence }
    : null
}

function normalizeWithMap (value: string): NormalizedText {
  let text = ''
  const starts: number[] = []
  const ends: number[] = []
  let whitespace = false

  for (let i = 0; i < value.length;) {
    const codePoint = value.codePointAt(i)!
    const char = String.fromCodePoint(codePoint)
    const rawEnd = i + char.length
    if (/\s/.test(char)) {
      if (!whitespace && text) {
        text += ' '
        starts.push(i)
        ends.push(rawEnd)
      }
      whitespace = true
      i = rawEnd
      continue
    }

    whitespace = false
    const normalizedChar = (PUNCTUATION[char] || char).toLowerCase()
    text += normalizedChar
    for (let j = 0; j < normalizedChar.length; j++) {
      starts.push(i)
      ends.push(rawEnd)
    }
    i = rawEnd
  }

  if (text.endsWith(' ')) {
    text = text.slice(0, -1)
    starts.pop()
    ends.pop()
  }

  return { text, starts, ends }
}

function normalize (value: string) {
  return normalizeWithMap(value).text
}

function findMatches (haystack: string, needle: string, limit = 80) {
  if (!needle) {
    return []
  }

  const result: number[] = []
  let start = 0
  while (result.length < limit) {
    const index = haystack.indexOf(needle, start)
    if (index < 0) {
      break
    }
    result.push(index)
    start = index + Math.max(1, needle.length)
  }
  return result
}

function normalizedMatchToRaw (match: number, length: number, normalized: NormalizedText) {
  const start = normalized.starts[match]
  const endIndex = match + length - 1
  const end = normalized.ends[endIndex] ?? normalized.ends[normalized.ends.length - 1]
  return { start, end }
}
