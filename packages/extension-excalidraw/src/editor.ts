import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { Excalidraw, Footer, exportToBlob, exportToSvg, getSceneVersion, loadFromBlob, loadLibraryFromBlob, serializeAsJSON } from '@excalidraw/excalidraw'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import type { AppState, BinaryFiles, LibraryItems } from '@excalidraw/excalidraw/types/types'
import { BaseCustomEditorContent } from '@yank-note/runtime-api'
import { LIBRARY_FILE, LIBRARY_RETURN_URL, SETTING_KEY_FONT_HANDWRITING } from './lib'
import i18n from './i18n'

class EditorContent extends BaseCustomEditorContent {
  logger = this.ctx.utils.getLogger('excalidraw-editor')

  contentType: string
  lastSceneVersion = -1
  currentSceneVersion = -1
  save = () => Promise.resolve(undefined)

  async readFile () {
    const isPng = this.io.file.path.toLowerCase().endsWith('.png')

    const content = await this.io.read(isPng)

    if (isPng) {
      this.contentType = 'image/png'
      return loadFromBlob(this.ctx.utils.dataURLtoBlob('data:image/png;base64,' + content), null, null)
    }

    if (this.io.file.path.toLowerCase().endsWith('.excalidraw')) {
      this.contentType = 'application/json'
    } else {
      this.contentType = (this.ctx.lib.mime as any).getType(this.io.file.path)
    }

    const blob = new Blob([content], { type: this.contentType })
    return await loadFromBlob(blob, null, null)
  }

  async writeFile (
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

      const dataURL = await this.ctx.utils.fileToBase64URL(blob)
      const base64 = dataURL.replace(/^data:image\/png;base64,/, '')

      content = base64
      isBase64 = true
    } else {
      throw new Error(`Unsupported content type: ${type}`)
    }

    this.logger.debug('writeFile', this.currentSceneVersion, type)
    await this.io.write(content, isBase64)
    this.lastSceneVersion = this.currentSceneVersion
  }

  async fetchLibrary (url: string) {
    this.logger.debug('fetchLibrary', url)
    const res = await fetch(url)
    const blob = await res.blob()
    return loadLibraryFromBlob(blob)
  }

  async saveLibrary (items: LibraryItems) {
    this.ctx.api.writeUserFile(LIBRARY_FILE, JSON.stringify(items))
  }

  async loadLibrary () {
    const res = await this.ctx.api.readUserFile(LIBRARY_FILE)
    return res.json()
  }

  changeHandWritingFont () {
    const styleId = 'x-custom-font-style'
    const oldStyle = document.getElementById(styleId)
    if (oldStyle) {
      oldStyle.remove()
    }

    const handwritingFont: string = this.ctx.setting.getSetting(SETTING_KEY_FONT_HANDWRITING as any)
    if (handwritingFont) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `@font-face {
        font-family: 'Virgil';
        src: local('${handwritingFont}');
        font-display: swap;
      }`
      document.head.appendChild(style)
    }
  }

  App = () => {
    const [initialData, setInitialData] = React.useState<any>(null)
    const [statusText, setStatusText] = React.useState<string>('')
    const [saving, setSaving] = React.useState<boolean>(false)
    const editorRef = React.useRef<any>(null)
    const prevLibraryItemsRef = React.useRef<any>('')
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    const saveFile = React.useCallback((
      type: string,
      elements: readonly ExcalidrawElement[],
      appState: Partial<AppState>,
      files: BinaryFiles
    ) => {
      if (that.currentSceneVersion === that.lastSceneVersion || saving) {
        return
      }

      setSaving(true)
      setStatusText(i18n.t('saving'))
      return that.writeFile(type, elements, appState, files)
        .then(() => {
          setTimeout(() => {
            setSaving(false)
            setStatusText(i18n.t('saved'))
            that.io.setStatus('saved')
          }, 300)
        })
        .catch(err => {
          setSaving(false)
          that.logger.error(err)
          setStatusText(err.message)
          that.ctx.ui.useToast().show('warning', err.message)
        })
    }, [])

    const handleDeepLink = React.useCallback(async ({ url }) => {
      if (url.startsWith(LIBRARY_RETURN_URL)) {
        const libraryURL = decodeURIComponent(url.split('#addLibrary=')[1] || '').replace(/&token=.+$/, '')
        if (libraryURL) {
          try {
            that.ctx.ui.useToast().show('info', 'Loading...', 20000)
            const libraryItems = await that.fetchLibrary(libraryURL)
            editorRef.current.updateLibrary({
              libraryItems,
              merge: true,
              openLibraryMenu: true,
            })
            that.ctx.ui.useToast().hide()
          } catch (error) {
            that.logger.error(error)
            that.ctx.ui.useToast().show('warning', 'Failed to load library')
          }
        }
      }
    }, [])

    React.useEffect(() => {
      that.ctx.registerHook('DEEP_LINK_OPEN', handleDeepLink)

      return () => {
        that.ctx.removeHook('DEEP_LINK_OPEN', handleDeepLink)
      }
    }, [handleDeepLink])

    React.useEffect(() => {
      setStatusText('Loading...')
      that.readFile().then(async data => {
        setInitialData(data)
        that.lastSceneVersion = getSceneVersion(data.elements)

        const libraryItems = that.loadLibrary()
        await that.ctx.utils.waitCondition(() => !!editorRef.current)
        editorRef.current.updateLibrary({ libraryItems, merge: false })
        setStatusText('')
      }).catch(err => {
        that.logger.error(err)
        setStatusText(err.message)
        that.ctx.ui.useToast().show('warning', err.message, 10000)
      })
    }, [])

    function onChange (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) {
      const version = getSceneVersion(elements)
      if (that.currentSceneVersion === version) {
        return
      }

      that.currentSceneVersion = version
      that.logger.debug('change', that.contentType, that.currentSceneVersion)

      if (that.currentSceneVersion !== that.lastSceneVersion) {
        setStatusText(i18n.t('unsaved'))
        that.io.setStatus('unsaved')
      }

      that.save = saveFile.bind(null, that.contentType, elements, appState, files)
      that.triggerAutoSave()
    }

    function onLibraryChange (items: LibraryItems) {
      if (JSON.stringify(items) === prevLibraryItemsRef.current) {
        return
      }

      prevLibraryItemsRef.current = items

      that.saveLibrary(items)
    }

    function excalidrawAPI (api) {
      editorRef.current = api
    }

    if (!initialData) {
      return null
    }

    const langCode = that.ctx.i18n.getCurrentLanguage()

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'div',
        { style: { width: '100vw', height: '100vh' } },
        React.createElement(
          Excalidraw,
          {
            excalidrawAPI,
            initialData,
            onChange,
            langCode,
            onLibraryChange,
            libraryReturnUrl: LIBRARY_RETURN_URL,
            validateEmbeddable: true,
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

  init () {
    const excalidrawWrapper = document.getElementById('app')
    const root = ReactDOM.createRoot(excalidrawWrapper)
    root.render(React.createElement(this.App))
    this.changeHandWritingFont()
  }
}

const editorContent = new EditorContent()
editorContent.init()
