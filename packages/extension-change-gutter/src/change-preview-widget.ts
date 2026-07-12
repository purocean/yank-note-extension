import type { editor } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { broomIcon } from './icons'
import type { BaselineSource, ChangeHunk, ChangePreviewLabels } from './types'

const maxPreviewLinesPerSide = 100
const maxVisibleRows = 6
const headerHeight = 30
const rowHeight = 20

interface RenderedIcon {
  element: HTMLElement
  dispose: () => void
}

type IconRenderer = (name: string) => RenderedIcon

export function getPreviewLayout (originalLineCount: number, currentLineCount: number) {
  const renderedRows =
    Math.min(originalLineCount, maxPreviewLinesPerSide) +
    Math.min(currentLineCount, maxPreviewLinesPerSide) +
    (originalLineCount > maxPreviewLinesPerSide ? 1 : 0) +
    (currentLineCount > maxPreviewLinesPerSide ? 1 : 0)

  return {
    visibleRows: Math.min(maxVisibleRows, Math.max(1, renderedRows)),
    scrollable: renderedRows > maxVisibleRows,
  }
}

interface PreviewHeightOptions {
  horizontalScrollbarHeight?: number
  wrappedContentHeight?: number
}

export function getPreviewHeight (visibleRows: number, options: PreviewHeightOptions = {}) {
  const baseContentHeight = visibleRows * rowHeight
  const contentHeight = options.wrappedContentHeight === undefined
    ? baseContentHeight
    : Math.min(
      maxVisibleRows * rowHeight,
      Math.max(baseContentHeight, options.wrappedContentHeight)
    )
  return headerHeight + contentHeight + Math.max(0, options.horizontalScrollbarHeight || 0)
}

export function getPreviewAfterLineNumber (anchorLineNumber: number, modelLineCount: number) {
  return Math.min(Math.max(1, modelLineCount), Math.max(0, anchorLineNumber - 1))
}

export class ChangePreviewWidget {
  private zoneId: string | null = null
  private hunkId: string | null = null
  private wordWrap = false
  private readonly viewDisposables: Array<{ dispose: () => void }> = []

  constructor (
    private readonly editor: editor.IStandaloneCodeEditor,
    private readonly renderIcon: IconRenderer
  ) {}

  get activeHunkId () {
    return this.hunkId
  }

  show (
    hunk: ChangeHunk,
    anchorLineNumber: number,
    source: BaselineSource,
    labels: ChangePreviewLabels,
    onSetBaseline: () => void,
    onRefreshBaseline: () => void,
    onRestore: () => void,
    onShowHistory: () => void
  ) {
    this.hide()

    const domNode = document.createElement('div')
    domNode.className = 'yn-change-gutter-preview'
    domNode.setAttribute('role', 'region')
    domNode.setAttribute('aria-label', labels.sourceTitles[source])
    domNode.addEventListener('mousedown', event => event.stopPropagation())
    domNode.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        this.hide()
        this.editor.focus()
      }
    })

    const header = document.createElement('div')
    header.className = 'yn-change-gutter-preview-header'

    const actions = document.createElement('span')
    actions.className = 'yn-change-gutter-preview-actions'
    actions.appendChild(this.createButton(labels.restore, 'yn-change-gutter-preview-restore', onRestore))
    actions.appendChild(this.createButton(labels.close, '', () => this.hide()))

    const wordWrapLabel = document.createElement('label')
    wordWrapLabel.className = 'yn-change-gutter-preview-word-wrap'
    const wordWrapInput = document.createElement('input')
    wordWrapInput.type = 'checkbox'
    wordWrapInput.checked = this.wordWrap
    wordWrapLabel.appendChild(wordWrapInput)
    wordWrapLabel.appendChild(document.createTextNode(labels.wordWrap))
    actions.appendChild(wordWrapLabel)
    actions.appendChild(this.createIconButton(
      labels.setBaseline,
      labels.setBaselineTitle,
      broomIcon,
      onSetBaseline
    ))
    actions.appendChild(this.createIconButton(
      labels.refreshBaseline,
      labels.refreshBaselineTitle,
      'sync-alt-solid',
      onRefreshBaseline
    ))
    actions.appendChild(this.createIconButton(labels.history, labels.history, 'history-solid', onShowHistory))
    header.appendChild(actions)

    const title = document.createElement('span')
    title.className = 'yn-change-gutter-preview-title'
    title.textContent = labels.sourceTitles[source]
    header.appendChild(title)
    domNode.appendChild(header)

    const body = document.createElement('div')
    body.className = 'yn-change-gutter-preview-body'
    const layout = getPreviewLayout(hunk.originalLines.length, hunk.currentLines.length)
    if (layout.scrollable) {
      body.classList.add('yn-change-gutter-preview-body-scrollable')
    }
    body.addEventListener('wheel', event => {
      if (body.scrollHeight > body.clientHeight || body.scrollWidth > body.clientWidth) {
        event.stopPropagation()
      }
    })
    this.appendLines(body, hunk.originalLines, 'removed', '-', labels)
    this.appendLines(body, hunk.currentLines, 'added', '+', labels)
    domNode.appendChild(body)

    const modelLineCount = this.editor.getModel()?.getLineCount() || 1
    const afterLineNumber = getPreviewAfterLineNumber(anchorLineNumber, modelLineCount)
    const viewZone: editor.IViewZone = {
      afterLineNumber,
      heightInPx: getPreviewHeight(layout.visibleRows),
      domNode,
    }
    let zoneId = ''
    this.editor.changeViewZones(accessor => {
      zoneId = accessor.addZone(viewZone)
    })
    this.zoneId = zoneId
    this.hunkId = hunk.id

    let layoutFrame: number | null = null
    const scheduleZoneLayout = () => {
      if (layoutFrame !== null) {
        cancelAnimationFrame(layoutFrame)
      }
      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = null
        if (this.zoneId !== zoneId) {
          return
        }
        const horizontalScrollbarHeight = this.wordWrap
          ? 0
          : Math.max(0, body.offsetHeight - body.clientHeight)
        const heightInPx = getPreviewHeight(layout.visibleRows, {
          horizontalScrollbarHeight,
          wrappedContentHeight: this.wordWrap ? body.scrollHeight : undefined,
        })
        if (viewZone.heightInPx === heightInPx) {
          return
        }
        viewZone.heightInPx = heightInPx
        this.editor.changeViewZones(accessor => accessor.layoutZone(zoneId))
        scheduleZoneLayout()
      })
    }
    this.viewDisposables.push({
      dispose: () => {
        if (layoutFrame !== null) {
          cancelAnimationFrame(layoutFrame)
          layoutFrame = null
        }
      },
    })

    const updateWordWrap = () => {
      this.wordWrap = wordWrapInput.checked
      body.classList.toggle('yn-change-gutter-preview-body-word-wrap', this.wordWrap)
      scheduleZoneLayout()
    }
    wordWrapInput.addEventListener('change', updateWordWrap)
    updateWordWrap()

    const updatePosition = () => {
      domNode.style.transform = `translateX(${this.editor.getScrollLeft()}px)`
    }
    const updateWidth = () => {
      domNode.style.width = `${this.editor.getLayoutInfo().contentWidth}px`
      updatePosition()
      scheduleZoneLayout()
    }
    updateWidth()
    this.viewDisposables.push(
      this.editor.onDidLayoutChange(updateWidth),
      this.editor.onDidScrollChange(event => {
        if (event.scrollLeftChanged) {
          updatePosition()
        }
      })
    )

    // Monaco places view zones behind its rendered text layer. Match the
    // established AI Copilot/Renumber widget behavior so controls receive input.
    setTimeout(() => {
      if (this.zoneId === zoneId && domNode.parentElement) {
        domNode.parentElement.style.zIndex = '3'
      }
    }, 0)
  }

  hide () {
    while (this.viewDisposables.length) {
      this.viewDisposables.pop()!.dispose()
    }
    if (this.zoneId) {
      const zoneId = this.zoneId
      this.zoneId = null
      this.editor.changeViewZones(accessor => accessor.removeZone(zoneId))
    }
    this.hunkId = null
  }

  private createButton (label: string, extraClass: string, onClick: () => void, title?: string) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `yn-change-gutter-preview-button ${extraClass}`.trim()
    button.textContent = label
    if (title) {
      button.title = title
    }
    button.addEventListener('click', event => {
      event.stopPropagation()
      onClick()
    })
    return button
  }

  private createIconButton (
    label: string,
    title: string,
    iconName: string,
    onClick: () => void
  ) {
    const button = this.createButton('', 'yn-change-gutter-preview-icon-button', onClick, title)
    button.setAttribute('aria-label', label)
    const icon = this.renderIcon(iconName)
    button.appendChild(icon.element)
    this.viewDisposables.push({ dispose: icon.dispose })
    return button
  }

  private appendLines (
    body: HTMLElement,
    lines: string[],
    type: 'added' | 'removed',
    marker: string,
    labels: ChangePreviewLabels
  ) {
    const visibleLines = lines.slice(0, maxPreviewLinesPerSide)
    for (const text of visibleLines) {
      const line = document.createElement('div')
      line.className = `yn-change-gutter-preview-line yn-change-gutter-preview-line-${type}`

      const markerNode = document.createElement('span')
      markerNode.className = 'yn-change-gutter-preview-marker'
      markerNode.textContent = marker
      line.appendChild(markerNode)

      const content = document.createElement('span')
      content.className = 'yn-change-gutter-preview-code'
      content.textContent = text
      line.appendChild(content)
      body.appendChild(line)
    }

    if (lines.length > visibleLines.length) {
      const truncated = document.createElement('div')
      truncated.className = 'yn-change-gutter-preview-truncated'
      truncated.textContent = `… ${labels.truncated}`
      body.appendChild(truncated)
    }
  }
}
