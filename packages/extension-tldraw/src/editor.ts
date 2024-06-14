import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { BaseCustomEditorContent, ctx } from '@yank-note/runtime-api'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Tldraw, createTLStore, TLStore, serializeTldrawJson, parseAndLoadDocument, useDefaultHelpers, useEditor } from 'tldraw'
import { getAssetUrls } from '@tldraw/assets/selfHosted'
// import i18n from './i18n'

import 'tldraw/tldraw.css'

const assetUrls = getAssetUrls({
  baseUrl: location.origin + location.pathname.slice(0, location.pathname.lastIndexOf('/')) + '/assets',
})

class EditorContent extends BaseCustomEditorContent {
  logger = this.ctx.utils.getLogger('tldraw-editor')
  contentType: string
  save = () => Promise.resolve(undefined)

  async readFile () {
    const isPng = false

    const content = await this.io.read(isPng)

    return content
  }

  async writeFile (
    store: TLStore
  ): Promise<void> {
    const content = await serializeTldrawJson(store)
    const isBase64 = false
    this.io.setStatus('unsaved')
    await this.io.write(content, isBase64).catch(err => {
      this.logger.error('save failed', err)
      this.io.setStatus('save-failed')
      throw err
    })
    this.io.setStatus('saved')
  }

  FileOpener = (props: { json: string }) => {
    const editor = useEditor()
    const { msg, addToast } = useDefaultHelpers()

    const onChange = (store: TLStore) => {
      this.logger.debug('change', this.contentType)

      this.io.setStatus('unsaved')
      this.save = this.writeFile.bind(this, store)
      this.triggerAutoSave()
    }

    React.useEffect(() => {
      parseAndLoadDocument(editor, props.json, msg, addToast, undefined, ctx.theme.getColorScheme() === 'dark').then(() => {
        const store = editor.store
        store.listen(() => onChange(store), { scope: 'document' })
      })
    }, [props.json])

    return null
  }

  App = () => {
    const [fileContent, setFileContent] = React.useState<string | null>(null)
    const [store] = React.useState(() => createTLStore()) as [ReturnType<typeof createTLStore>]

    React.useLayoutEffect(() => {
      this.readFile().then(content => {
        setFileContent(content)
      })
    }, [store])

    if (!fileContent) {
      return null
    }

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'div',
        { style: { width: '100vw', height: '100vh' } },
        React.createElement(
          Tldraw,
          { assetUrls, store },
          React.createElement(this.FileOpener, { json: fileContent })
        ),
      ),
    )
  }

  init () {
    const tldrawWrapper = document.getElementById('app')
    const root = ReactDOM.createRoot(tldrawWrapper)
    root.render(React.createElement(this.App))
  }
}

const editorContent = new EditorContent()
editorContent.init()
