import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { Excalidraw, Footer, exportToBlob, exportToSvg, getSceneVersion, loadFromBlob, loadLibraryFromBlob, serializeAsJSON } from '@excalidraw/excalidraw'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import type { Ctx } from '@yank-note/runtime-api/types/types/renderer/context'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import type { AppState, BinaryFiles, LibraryItems } from '@excalidraw/excalidraw/types/types'
import { LIBRARY_FILE, LIBRARY_RETURN_URL } from './lib'
import i18n from './i18n'

const search = new URLSearchParams(window.location.search)
const ctx: Ctx = (window as any).ctx
const logger = ctx.utils.getLogger('excalidraw-editor')
const file: Doc = {
  type: 'file',
  name: search.get('name') || '',
  path: search.get('path') || '',
  repo: search.get('repo') || '',
}

let contentType: string
let contentHash: string
let lastSceneVersion = -1
let currentSceneVersion = -1

async function readFile () {
  if (!file.name || !file.path || !file.repo || !ctx) {
    throw new Error('Invalid File')
  }

  const isPng = file.path.toLowerCase().endsWith('.png')

  const res = await ctx.api.readFile(file, isPng)
  const content = res.content
  contentHash = res.hash

  if (isPng) {
    contentType = 'image/png'
    return loadFromBlob(ctx.utils.dataURLtoBlob('data:image/png;base64,' + content), null, null)
  }

  if (file.path.toLowerCase().endsWith('.excalidraw')) {
    contentType = 'application/json'
  } else {
    contentType = (ctx.lib.mime as any).getType(file.path)
  }

  const blob = new Blob([content], { type: contentType })
  return await loadFromBlob(blob, null, null)
}

async function writeFile (
  type: string,
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  files: BinaryFiles
): Promise<void> {
  appState.exportEmbedScene = true

  let content: string
  let isBase64: boolean
  if (type === 'image/svg+xml') {
    const svg = await exportToSvg({ elements, appState, files })

    content = svg.outerHTML
    isBase64 = false
  } else if (type === 'application/json') {
    const json = serializeAsJSON(elements, appState, files, 'local')
    content = json
    isBase64 = false
  } else if (type === 'image/png') {
    const blob = await exportToBlob({
      elements,
      appState,
      files,
      getDimensions (width, height) {
        const scale = appState.exportScale || 2
        return {
          width: width * scale,
          height: height * scale,
          scale,
        }
      },
    })

    const dataURL = await ctx.utils.fileToBase64URL(blob)
    const base64 = dataURL.replace(/^data:image\/png;base64,/, '')

    content = base64
    isBase64 = true
  } else {
    throw new Error(`Unsupported content type: ${type}`)
  }

  logger.debug('writeFile', currentSceneVersion, type)
  const res = await ctx.api.writeFile({ ...file, contentHash }, content, isBase64)

  contentHash = res.hash
  lastSceneVersion = currentSceneVersion
}

async function fetchLibrary (url: string) {
  logger.debug('fetchLibrary', url)
  const res = await fetch(url)
  const blob = await res.blob()
  return loadLibraryFromBlob(blob)
}

async function saveLibrary (items: LibraryItems) {
  ctx.api.writeUserFile(LIBRARY_FILE, JSON.stringify(items))
}

async function loadLibrary () {
  const res = await ctx.api.readUserFile(LIBRARY_FILE)
  return res.json()
}

const App = () => {
  const [initialData, setInitialData] = React.useState<any>(null)
  const [statusText, setStatusText] = React.useState<string>('')
  const [saving, setSaving] = React.useState<boolean>(false)
  const editorRef = React.useRef<any>(null)
  const prevLibraryItemsRef = React.useRef<any>('')

  const saveFile = React.useCallback((
    type: string,
    elements: readonly ExcalidrawElement[],
    appState: Partial<AppState>,
    files: BinaryFiles
  ) => {
    if (currentSceneVersion === lastSceneVersion || saving) {
      return
    }

    setSaving(true)
    setStatusText(i18n.t('saving'))
    writeFile(type, elements, appState, files)
      .then(() => {
        setTimeout(() => {
          setSaving(false)
          setStatusText(i18n.t('saved'))
          ctx.store.state.currentFile!.status = 'saved'
        }, 300)
      })
      .catch(err => {
        setSaving(false)
        logger.error(err)
        setStatusText(err.message)
        ctx.ui.useToast().show('warning', err.message)
      })
  }, [])

  const handleDeepLink = React.useCallback(async ({ url }) => {
    if (url.startsWith(LIBRARY_RETURN_URL)) {
      const libraryURL = decodeURIComponent(url.split('#addLibrary=')[1] || '').replace(/&token=.+$/, '')
      if (libraryURL) {
        try {
          ctx.ui.useToast().show('info', 'Loading...', 20000)
          const libraryItems = await fetchLibrary(libraryURL)
          editorRef.current.updateLibrary({
            libraryItems,
            merge: true,
            openLibraryMenu: true,
          })
          ctx.ui.useToast().hide()
        } catch (error) {
          logger.error(error)
          ctx.ui.useToast().show('warning', 'Failed to load library')
        }
      }
    }
  }, [])

  const writeFileDebounced = React.useCallback(ctx.lib.lodash.debounce(saveFile, 2000), [saveFile])

  React.useEffect(() => {
    ctx.registerHook('DEEP_LINK_OPEN', handleDeepLink)

    return () => {
      ctx.removeHook('DEEP_LINK_OPEN', handleDeepLink)
    }
  }, [handleDeepLink])

  React.useEffect(() => {
    setStatusText('Loading...')
    readFile().then(async data => {
      setInitialData(data)
      lastSceneVersion = getSceneVersion(data.elements)

      const libraryItems = loadLibrary()
      await ctx.utils.waitCondition(() => !!editorRef.current)
      editorRef.current.updateLibrary({ libraryItems, merge: false })
      setStatusText('')
    }).catch(err => {
      logger.error(err)
      setStatusText(err.message)
      ctx.ui.useToast().show('warning', err.message, 10000)
    })
  }, [])

  function onChange (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) {
    currentSceneVersion = getSceneVersion(elements)
    logger.debug('change', contentType, currentSceneVersion)

    if (currentSceneVersion !== lastSceneVersion) {
      setStatusText(i18n.t('unsaved'))
      ctx.store.state.currentFile!.status = 'unsaved'
    }

    writeFileDebounced(contentType, elements, appState, files)
  }

  function onLibraryChange (items: LibraryItems) {
    if (JSON.stringify(items) === prevLibraryItemsRef.current) {
      return
    }

    prevLibraryItemsRef.current = items

    saveLibrary(items)
  }

  if (!initialData) {
    return null
  }

  const langCode = ctx.i18n.getCurrentLanguage()

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { style: { width: '100vw', height: '100vh' } },
      React.createElement(
        Excalidraw,
        {
          ref: editorRef,
          initialData,
          onChange,
          langCode,
          onLibraryChange,
          libraryReturnUrl: LIBRARY_RETURN_URL,
          UIOptions: {
            canvasActions: {
              loadScene: false,
            },
          },
        },
        React.createElement(Footer, {}, React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            height: '40px',
            paddingLeft: '10px',
            fontSize: '13px',
          }
        }, saving ? i18n.t('saving') : statusText)),
      ),
    ),
  )
}

const excalidrawWrapper = document.getElementById('app')
const root = ReactDOM.createRoot(excalidrawWrapper)
root.render(React.createElement(App))

;(window as any).getIsDirty = function () {
  return currentSceneVersion !== lastSceneVersion
}
