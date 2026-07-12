import { registerPlugin } from '@yank-note/runtime-api'
import { createReviewLocator } from './locator'
import {
  createReviewId,
  deleteReviewBlock,
  insertReviewBlock,
  parseReviewBlocks,
  renderReviewBlock,
  replaceReviewBlock,
} from './storage'
import { RenderedTextIndex } from './text-index'
import { reviewStyles } from './styles'
import type { ResolvedReview, ReviewAnchor, ReviewLabels } from './types'

const extensionId = __EXTENSION_ID__
const addActionName = extensionId + '.add-comment'
const reviewSelector = '[id^="yn-review-"]'
const icons = {
  comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>',
  locate: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/></svg>',
  remove: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></svg>',
  warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20zM12 9v5M12 18h.01"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  send: '<svg viewBox="0 0 512 512" aria-hidden="true"><path d="M476 3.2 12.5 270.6c-18.1 10.4-15.8 35.6 3.6 43.8L122.7 359l290.7-256.7c5.6-5 13.3 2.6 8.5 8.4L178.8 407.2v80.6c0 23.6 28.5 32.9 42.5 15.8L285 426l125 52.3c14.5 6.1 31-3 33.6-18.5l68-432C514.7 8.1 492.9-6.5 476 3.2z"/></svg>',
}

interface RectSnapshot {
  left: number
  top: number
  right: number
  bottom: number
}

interface PendingSelection {
  anchor: ReviewAnchor
  rect: RectSnapshot
}

interface RangeHighlighter {
  remove: () => void
  highlightRanges: (ranges: Range[]) => unknown
}

registerPlugin({
  name: extensionId,
  register (ctx) {
    const logger = ctx.utils.getLogger('extension:review')
    const i18n = ctx.i18n.createI18n({
      en: {
        reviewTitle: 'Review comment',
        omitted: '… %s characters omitted …',
        addComment: 'Add review comment',
        editComment: 'Edit review comment',
        placeholder: 'Write a review comment…',
        save: 'Save',
        close: 'Close',
        locate: 'Locate',
        edit: 'Edit',
        remove: 'Delete',
        unresolved: 'Target not found',
        selectFirst: 'Select text in the preview first.',
        commentRequired: 'Please enter a comment.',
        removeAgain: 'Click again to delete',
      },
      'zh-CN': {
        reviewTitle: '批注',
        omitted: '……中间省略 %s 字……',
        addComment: '添加批注',
        editComment: '编辑批注',
        placeholder: '输入批注意见……',
        save: '保存',
        close: '关闭',
        locate: '定位',
        edit: '编辑',
        remove: '删除',
        unresolved: '未找到原文位置',
        selectFirst: '请先在预览中选择文字。',
        commentRequired: '请输入批注意见。',
        removeAgain: '再次点击删除',
      },
      'zh-TW': {
        reviewTitle: '批註',
        omitted: '……中間省略 %s 字……',
        addComment: '新增批註',
        editComment: '編輯批註',
        placeholder: '輸入批註意見……',
        save: '儲存',
        close: '關閉',
        locate: '定位',
        edit: '編輯',
        remove: '刪除',
        unresolved: '未找到原文位置',
        selectFirst: '請先在預覽中選取文字。',
        commentRequired: '請輸入批註意見。',
        removeAgain: '再次點擊刪除',
      },
    })

    const labels = (): ReviewLabels => ({
      reviewTitle: i18n.t('reviewTitle'),
      omitted: chars => i18n.t('omitted', String(chars)),
    })

    const allHighlighter = ctx.utils.createTextHighlighter(
      () => ctx.view.getViewDom(),
      'yn-review',
      color => color === 'dark'
        ? 'color: #eafffc; background-color: rgba(45, 212, 191, .26); text-decoration: underline; text-decoration-color: #5eead4;'
        : 'color: #063f3d; background-color: rgba(20, 184, 166, .24); text-decoration: underline; text-decoration-color: #0f8f88;'
    ) as RangeHighlighter
    const activeHighlighter = ctx.utils.createTextHighlighter(
      () => ctx.view.getViewDom(),
      'yn-review-active',
      color => color === 'dark'
        ? 'color: #f0ffff; background-color: rgba(34, 211, 238, .46); text-decoration: underline 2px; text-decoration-color: #67e8f9;'
        : 'color: #042f35; background-color: rgba(6, 182, 212, .38); text-decoration: underline 2px; text-decoration-color: #087f8c;'
    ) as RangeHighlighter

    let currentDocument: Document | null = null
    let textIndex: RenderedTextIndex | null = null
    let reviews = new Map<string, ResolvedReview>()
    let pendingSelection: PendingSelection | null = null
    let activeReviewId: string | null = null
    let floatingButton: HTMLButtonElement | null = null
    let composer: HTMLElement | null = null
    let selectionTimer: ReturnType<typeof setTimeout> | null = null
    let armedDeleteButton: HTMLButtonElement | null = null
    let deleteArmTimer: ReturnType<typeof setTimeout> | null = null

    ctx.view.addStyles(reviewStyles, false)

    function getSource () {
      return ctx.editor.getEditor().getModel()?.getValue() || ctx.view.getRenderEnv()?.source || ''
    }

    function replaceSource (nextSource: string) {
      const editor = ctx.editor.getEditor()
      const model = editor.getModel()
      const source = model?.getValue()
      if (!model || source === undefined || source === nextSource) {
        return false
      }

      let start = 0
      const sharedLength = Math.min(source.length, nextSource.length)
      while (start < sharedLength && source[start] === nextSource[start]) {
        start++
      }

      let sourceEnd = source.length
      let nextEnd = nextSource.length
      while (sourceEnd > start && nextEnd > start && source[sourceEnd - 1] === nextSource[nextEnd - 1]) {
        sourceEnd--
        nextEnd--
      }

      const startPosition = model.getPositionAt(start)
      const endPosition = model.getPositionAt(sourceEnd)

      let replaced = false
      void ctx.view.disableSyncScrollAwhile(() => {
        editor.pushUndoStop()
        replaced = editor.executeEdits(addActionName, [{
          range: {
            startLineNumber: startPosition.lineNumber,
            startColumn: startPosition.column,
            endLineNumber: endPosition.lineNumber,
            endColumn: endPosition.column,
          },
          text: nextSource.slice(start, nextEnd),
        }])
        editor.pushUndoStop()
        if (replaced) {
          ctx.view.render()
        }
      }).catch(error => logger.error('replace source failed', error))
      return replaced
    }

    function refresh () {
      const view = ctx.view.getViewDom()
      if (!view) {
        allHighlighter.remove()
        activeHighlighter.remove()
        return
      }

      clearSelectionTimer()
      pendingSelection = null
      removeFloatingUi()
      disarmDelete()
      bindDocument(view.ownerDocument)
      textIndex = new RenderedTextIndex(view)
      const locateReview = createReviewLocator(textIndex)
      const blocks = parseReviewBlocks(ctx.view.getRenderEnv()?.source || getSource())
      const nextReviews = new Map<string, ResolvedReview>()
      const ranges: Range[] = []

      blocks.forEach(block => {
        const root = view.ownerDocument.getElementById(block.id)
        const location = locateReview(block.anchor)
        const review: ResolvedReview = { ...block, root, location }
        nextReviews.set(block.id, review)
        if (location) {
          ranges.push(location.range)
        }
        decorateReview(review)
      })

      reviews = nextReviews
      allHighlighter.highlightRanges(ranges)
      refreshActiveHighlight()
    }

    function bindDocument (doc: Document) {
      if (currentDocument === doc) {
        return
      }

      if (currentDocument) {
        currentDocument.removeEventListener('mousedown', handleDocumentMouseDown, true)
        currentDocument.removeEventListener('mouseup', handleMouseUp, true)
        currentDocument.removeEventListener('selectionchange', handleSelectionChange, true)
        currentDocument.removeEventListener('click', handleDocumentClick, true)
        currentDocument.defaultView?.removeEventListener('blur', handleWindowBlur)
      }

      clearSelectionTimer()
      removeFloatingUi()
      currentDocument = doc
      doc.addEventListener('mousedown', handleDocumentMouseDown, true)
      doc.addEventListener('mouseup', handleMouseUp, true)
      doc.addEventListener('selectionchange', handleSelectionChange, true)
      doc.addEventListener('click', handleDocumentClick, true)
      doc.defaultView?.addEventListener('blur', handleWindowBlur)
    }

    function handleDocumentMouseDown (event: Event) {
      const target = event.target as Node | null
      if (composer && target && !composer.contains(target)) {
        removeComposer()
      }
    }

    function handleWindowBlur () {
      removeComposer()
    }

    function handleMouseUp (event: Event) {
      const target = event.target as HTMLElement | null
      if (target?.closest('.yn-review-composer, .yn-review-floating-button, .yn-review-actions, ' + reviewSelector)) {
        return
      }
      scheduleSelectionCapture()
    }

    function handleSelectionChange () {
      if (!composer) {
        scheduleSelectionCapture()
      }
    }

    function scheduleSelectionCapture () {
      clearSelectionTimer()
      selectionTimer = setTimeout(() => {
        selectionTimer = null
        if (!composer) {
          captureSelection(true)
        }
      }, 40)
    }

    function clearSelectionTimer () {
      if (selectionTimer) {
        clearTimeout(selectionTimer)
        selectionTimer = null
      }
    }

    function handleDocumentClick (event: Event) {
      const mouseEvent = event as MouseEvent
      const target = mouseEvent.target as HTMLElement | null
      if (!target?.closest('.yn-review-delete-armed')) {
        disarmDelete()
      }
      if (
        !textIndex ||
        pendingSelection ||
        target?.closest('a, button, input, textarea, select, summary, .yn-review-composer, ' + reviewSelector)
      ) {
        return
      }

      const offset = textIndex.offsetFromPoint(mouseEvent.clientX, mouseEvent.clientY)
      if (offset === null) {
        return
      }

      const matched = Array.from(reviews.values())
        .filter(review => review.location && offset >= review.location.start && offset < review.location.end)
        .sort((a, b) => {
          const aLength = a.location!.end - a.location!.start
          const bLength = b.location!.end - b.location!.start
          return aLength - bLength
        })[0]

      if (matched) {
        mouseEvent.preventDefault()
        activateReview(matched)
        openEditComposer(matched, pointRect(mouseEvent.clientX, mouseEvent.clientY, matched.root?.ownerDocument))
      }
    }

    function captureSelection (showButton: boolean) {
      const view = ctx.view.getViewDom()
      const doc = view?.ownerDocument
      const selection = doc?.getSelection()
      if (!view || !doc || !selection || selection.rangeCount < 1 || selection.isCollapsed) {
        pendingSelection = null
        if (showButton) {
          removeFloatingButton()
        }
        return null
      }

      const range = selection.getRangeAt(0).cloneRange()
      const startElement = getElement(range.startContainer)
      const endElement = getElement(range.endContainer)
      if (
        !view.contains(range.commonAncestorContainer) ||
        startElement?.closest(reviewSelector) ||
        endElement?.closest(reviewSelector)
      ) {
        pendingSelection = null
        removeFloatingButton()
        return null
      }

      const index = textIndex?.root === view ? textIndex : new RenderedTextIndex(view)
      const anchor = index.createAnchor(range)
      if (!anchor) {
        pendingSelection = null
        if (showButton) {
          removeFloatingButton()
        }
        return null
      }

      textIndex = index
      pendingSelection = { anchor, rect: snapshotRect(range) }
      if (showButton) {
        showFloatingButton()
      }
      return pendingSelection
    }

    function showFloatingButton () {
      if (!pendingSelection || !currentDocument) {
        return
      }

      removeFloatingButton()
      const button = currentDocument.createElement('button')
      button.type = 'button'
      button.className = 'yn-review-floating-button'
      button.title = i18n.t('addComment')
      button.setAttribute('aria-label', i18n.t('addComment'))
      button.appendChild(createIconElement(currentDocument, icons.comment))
      button.addEventListener('mousedown', event => event.preventDefault())
      button.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        openCreateComposer(pendingSelection!)
      })
      currentDocument.body.appendChild(button)
      positionFloating(button, pendingSelection.rect)
      floatingButton = button
    }

    function openCreateComposer (selection: PendingSelection) {
      openComposer({
        title: i18n.t('addComment'),
        value: '',
        rect: selection.rect,
        onSave: comment => {
          const id = createReviewId()
          const block = renderReviewBlock(id, selection.anchor, comment, labels())
          const positions = new Map(Array.from(reviews, ([reviewId, review]) => [
            reviewId,
            review.location?.start ?? review.anchor.renderedStart,
          ]))
          positions.set(id, selection.anchor.renderedStart)
          return replaceSource(insertReviewBlock(getSource(), block, positions))
        },
      })
    }

    function openEditComposer (review: ResolvedReview, rect?: RectSnapshot) {
      openComposer({
        title: i18n.t('editComment'),
        value: review.comment,
        rect: rect || snapshotElementRect(review.root),
        onSave: comment => updateReview(review.id, review.anchor, comment),
        onRemove: () => removeReview(review.id),
      })
    }

    function openComposer (options: {
      title: string
      value: string
      rect: RectSnapshot
      onSave: (comment: string) => boolean
      onRemove?: () => void
    }) {
      const doc = currentDocument
      if (!doc) {
        return
      }

      removeComposer()
      removeFloatingButton()

      const panel = doc.createElement('div')
      panel.className = 'yn-review-composer'
      const title = doc.createElement('div')
      title.className = 'yn-review-composer-title'
      title.textContent = options.title
      const close = createIconButton(doc, i18n.t('close'), icons.close, () => removeComposer())
      close.className = 'yn-review-composer-icon-button yn-review-composer-close'
      const onRemove = options.onRemove
      let remove: HTMLButtonElement | null = null
      if (onRemove) {
        remove = createIconButton(doc, i18n.t('remove'), icons.remove, () => {
          if (!remove) {
            return
          }
          if (armedDeleteButton === remove) {
            onRemove()
            removeComposer()
          } else {
            armDelete(remove)
          }
        })
        remove.className = 'yn-review-composer-icon-button yn-review-composer-remove'
      }
      const textarea = doc.createElement('textarea')
      textarea.placeholder = i18n.t('placeholder')
      textarea.value = options.value
      const input = doc.createElement('div')
      input.className = 'yn-review-composer-input'
      const saveShortcut = ctx.keybinding.getKeysLabel([ctx.keybinding.CtrlCmd, 'Enter'])
      const send = createIconButton(doc, `${i18n.t('save')} ${saveShortcut}`, icons.send, () => saveComment())
      send.className = 'yn-review-composer-icon-button yn-review-composer-send'
      input.append(textarea, send)
      panel.append(title)
      if (remove) {
        panel.append(remove)
      }
      panel.append(close, input)
      panel.addEventListener('mousedown', event => event.stopPropagation())
      panel.addEventListener('click', event => event.stopPropagation())
      panel.addEventListener('focusout', () => {
        setTimeout(() => {
          if (composer === panel && !panel.contains(doc.activeElement)) {
            removeComposer()
          }
        }, 0)
      })
      panel.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          removeComposer()
        } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          saveComment()
        }
      })

      function saveComment () {
        const value = textarea.value.trim()
        if (!value) {
          ctx.ui.useToast().show('warning', i18n.t('commentRequired'))
          return
        }
        if (options.onSave(value)) {
          pendingSelection = null
          removeComposer()
        }
      }

      doc.body.appendChild(panel)
      composer = panel
      positionFloating(panel, options.rect)
      setTimeout(() => textarea.focus(), 0)
    }

    function updateReview (id: string, anchor: ReviewAnchor, comment: string) {
      const source = getSource()
      const current = parseReviewBlocks(source).find(block => block.id === id)
      if (!current) {
        return false
      }
      const replacement = renderReviewBlock(id, anchor, comment, labels())
      return replaceSource(replaceReviewBlock(source, current, replacement))
    }

    function removeReview (id: string) {
      disarmDelete()
      const source = getSource()
      const current = parseReviewBlocks(source).find(block => block.id === id)
      if (!current) {
        return
      }

      const nextSource = deleteReviewBlock(source, current)
      if (replaceSource(nextSource) && activeReviewId === id) {
        activeReviewId = null
        activeHighlighter.remove()
      }
    }

    function decorateReview (review: ResolvedReview) {
      const root = review.root
      if (!root) {
        return
      }

      root.classList.add('yn-review-card')
      root.classList.toggle('yn-review-unresolved', !review.location)
      root.querySelector(':scope > .yn-review-actions')?.remove()
      decorateContextSummary(review)

      const doc = root.ownerDocument
      const title = root.querySelector(':scope > .custom-container-title')
      title?.querySelector(':scope > .yn-review-status')?.remove()
      const actions = doc.createElement('div')
      actions.className = 'yn-review-actions'
      if (!review.location && title) {
        const status = doc.createElement('span')
        status.className = 'yn-review-status'
        status.title = i18n.t('unresolved')
        status.setAttribute('aria-label', i18n.t('unresolved'))
        status.appendChild(createIconElement(doc, icons.warning))
        title.appendChild(status)
      }

      const removeButton = createIconButton(doc, i18n.t('remove'), icons.remove, () => {
        if (armedDeleteButton === removeButton) {
          removeReview(review.id)
        } else {
          armDelete(removeButton)
        }
      })
      actions.append(
        createIconButton(doc, i18n.t('locate'), icons.locate, () => activateReview(review, true)),
        createIconButton(doc, i18n.t('edit'), icons.edit, () => openEditComposer(review)),
        removeButton
      )

      if (title) {
        title.insertAdjacentElement('afterend', actions)
      } else {
        root.prepend(actions)
      }
    }

    function decorateContextSummary (review: ResolvedReview) {
      const details = review.root?.querySelector<HTMLElement>(':scope > .custom-container.details')
      if (!details) {
        return
      }

      let summary = details.querySelector<HTMLElement>(':scope > summary')
      if (!summary) {
        summary = details.ownerDocument.createElement('summary')
        details.prepend(summary)
      }
      summary.className = 'yn-review-context-summary'
      summary.textContent = getSelectedTextSummary(review.anchor)
    }

    function getSelectedTextSummary (anchor: ReviewAnchor) {
      const selectedText = anchor.exact !== undefined
        ? anchor.exact
        : [anchor.head, anchor.tail].filter(Boolean).join(' … ')
      return selectedText.replace(/\s+/g, ' ').trim() || '…'
    }

    function activateReview (review: ResolvedReview, reveal = false) {
      activeReviewId = review.id
      refreshActiveHighlight()

      if (review.location) {
        if (reveal) {
          getElement(review.location.range.startContainer)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }

      if (reveal && review.anchor.sourceLineStart) {
        ctx.view.highlightLine(review.anchor.sourceLineStart, true, 1600)
      }
    }

    function refreshActiveHighlight () {
      const review = activeReviewId ? reviews.get(activeReviewId) : null
      if (review?.location) {
        activeHighlighter.highlightRanges([review.location.range])
      } else {
        activeHighlighter.remove()
      }
    }

    function createButton (doc: Document, text: string, handler: () => any) {
      const button = doc.createElement('button')
      button.type = 'button'
      button.textContent = text
      button.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        handler()
      })
      return button
    }

    function createIconButton (doc: Document, title: string, icon: string, handler: () => any) {
      const button = createButton(doc, '', handler)
      button.title = title
      button.setAttribute('aria-label', title)
      button.appendChild(createIconElement(doc, icon))
      return button
    }

    function createIconElement (doc: Document, icon: string) {
      const element = doc.createElement('span')
      element.className = 'yn-review-icon'
      element.innerHTML = icon
      return element
    }

    function armDelete (button: HTMLButtonElement) {
      disarmDelete()
      armedDeleteButton = button
      button.parentElement?.classList.add('yn-review-delete-confirming')
      button.classList.add('yn-review-delete-armed')
      button.removeAttribute('title')
      button.setAttribute('aria-label', i18n.t('removeAgain'))
      const label = button.ownerDocument.createElement('span')
      label.className = 'yn-review-delete-label'
      label.textContent = i18n.t('removeAgain')
      button.appendChild(label)
      deleteArmTimer = setTimeout(() => disarmDelete(), 4000)
    }

    function disarmDelete () {
      if (deleteArmTimer) {
        clearTimeout(deleteArmTimer)
        deleteArmTimer = null
      }
      if (armedDeleteButton) {
        armedDeleteButton.parentElement?.classList.remove('yn-review-delete-confirming')
        armedDeleteButton.querySelector(':scope > .yn-review-delete-label')?.remove()
        armedDeleteButton.classList.remove('yn-review-delete-armed')
        armedDeleteButton.title = i18n.t('remove')
        armedDeleteButton.setAttribute('aria-label', i18n.t('remove'))
        armedDeleteButton = null
      }
    }

    function positionFloating (element: HTMLElement, rect: RectSnapshot) {
      const doc = element.ownerDocument
      const win = doc.defaultView
      const width = doc.documentElement.clientWidth
      const height = doc.documentElement.clientHeight
      const scrollX = win?.scrollX || 0
      const scrollY = win?.scrollY || 0
      const margin = 12
      const elementWidth = element.offsetWidth || 160
      const elementHeight = element.offsetHeight || 40
      const left = Math.max(scrollX + margin, Math.min(rect.left, scrollX + width - elementWidth - margin))
      let top = rect.bottom + 8
      if (top + elementHeight > scrollY + height - margin) {
        top = Math.max(scrollY + margin, rect.top - elementHeight - 8)
      }
      element.style.left = `${left}px`
      element.style.top = `${top}px`
    }

    function snapshotRect (range: Range): RectSnapshot {
      const rects = Array.from(range.getClientRects()).filter(rect => rect.width || rect.height)
      const rect = rects[rects.length - 1] || range.getBoundingClientRect()
      const doc = range.startContainer.ownerDocument || currentDocument
      return doc ? toDocumentRect(doc, rect) : toRectSnapshot(rect)
    }

    function snapshotElementRect (element: HTMLElement | null): RectSnapshot {
      const rect = element?.getBoundingClientRect()
      return rect
        ? toDocumentRect(element!.ownerDocument, rect)
        : pointRect(24, 24, currentDocument)
    }

    function pointRect (x: number, y: number, doc?: Document | null): RectSnapshot {
      const scrollX = doc?.defaultView?.scrollX || 0
      const scrollY = doc?.defaultView?.scrollY || 0
      return { left: x + scrollX, right: x + scrollX, top: y + scrollY, bottom: y + scrollY }
    }

    function toDocumentRect (doc: Document, rect: DOMRectReadOnly): RectSnapshot {
      const scrollX = doc.defaultView?.scrollX || 0
      const scrollY = doc.defaultView?.scrollY || 0
      return {
        left: rect.left + scrollX,
        right: rect.right + scrollX,
        top: rect.top + scrollY,
        bottom: rect.bottom + scrollY,
      }
    }

    function toRectSnapshot (rect: DOMRectReadOnly): RectSnapshot {
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
    }

    function getElement (node: Node) {
      return node.nodeType === node.ELEMENT_NODE ? node as HTMLElement : node.parentElement
    }

    function removeFloatingButton () {
      floatingButton?.remove()
      floatingButton = null
    }

    function removeComposer () {
      if (armedDeleteButton && composer?.contains(armedDeleteButton)) {
        disarmDelete()
      }
      composer?.remove()
      composer = null
      pendingSelection = null
    }

    function removeFloatingUi () {
      removeFloatingButton()
      removeComposer()
    }

    ctx.action.registerAction({
      name: addActionName,
      description: i18n.t('addComment'),
      keys: [ctx.keybinding.CtrlCmd, ctx.keybinding.Alt, 'M'],
      forUser: true,
      when: () => !!ctx.view.getViewDom(),
      handler: () => {
        const selection = captureSelection(false)
        if (!selection) {
          ctx.ui.useToast().show('warning', i18n.t('selectFirst'))
          return
        }

        openCreateComposer(selection)
      }
    })

    ctx.registerHook('VIEW_RENDERED', refresh)
    ctx.registerHook('VIEW_FILE_CHANGE', () => {
      clearSelectionTimer()
      disarmDelete()
      pendingSelection = null
      activeReviewId = null
      reviews.clear()
      removeFloatingUi()
      allHighlighter.remove()
      activeHighlighter.remove()
    })

    refresh()
  }
})
