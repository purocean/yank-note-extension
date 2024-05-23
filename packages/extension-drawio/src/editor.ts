import { BaseCustomEditorContent, getExtensionBasePath } from '@yank-note/runtime-api'

class EditorContent extends BaseCustomEditorContent {
  logger = this.ctx.utils.getLogger('drawio-editor')

  contentType: string
  save = () => Promise.resolve()

  init () {
    const BASE_URL = location.origin + this.ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), 'drawio/src/main/webapp')
    const inIframe = !!window.parent

    const DRAW_IFRAME_URL = `${BASE_URL}/index.html?embed=1&atlas=1&proto=json${inIframe ? '&noExitBtn=1' : ''}`

    const iframe = document.createElement('iframe')
    iframe.style.boxSizing = 'border-box'
    iframe.style.display = 'block'
    iframe.style.width = '100vw'
    iframe.style.height = '100vh'
    iframe.style.border = 'none'
    iframe.setAttribute('frameborder', '0')
    iframe.addEventListener('load', () => {
      (iframe!.contentWindow as any).EXPORT_URL = 'https://convert.diagrams.net/node/export?__allow-open-window__'
    })

    const path = this.io.file.path.toLowerCase()
    const asPng = path.endsWith('.png')
    const asSvg = path.endsWith('.svg')

    const receive = async (evt: { data: string }) => {
      const win: any = iframe.contentWindow!
      try {
        if (evt.data.length < 1) {
          return
        }

        const msg = JSON.parse(evt.data)
        const { event } = msg

        if (event === 'init') {
          // hack for get editorUI
          const _updateActionStates = win.App.prototype.updateActionStates
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const that = this
          let converter

          win.App.prototype.updateActionStates = function (...args: any[]) {
            (window as any).drawioApp = this
            win.App.prototype.updateActionStates = _updateActionStates

            // patch for drawio, fix image url
            if (!converter) {
              converter = this.createImageUrlConverter()
              // eslint-disable-next-line no-proto
              const isRelativeUrl = converter.__proto__.isRelativeUrl
              // eslint-disable-next-line no-proto
              converter.__proto__.isRelativeUrl = function (url) {
                if (url && url.match(/^([a-zA-Z0-9_-]+:)\/\//)) {
                  return false
                }

                return isRelativeUrl.apply(this, [url])
              }
            }

            that.save = async () => {
              this.actions.actions.save.funct(false)
            }

            Object.defineProperty(this.editor, 'modified', {
              get () {
                return that.io.isDirty()
              },
              set (val) {
                that.io.setStatus(val ? 'unsaved' : 'saved')
              }
            })

            return _updateActionStates.apply(this, args)
          }

          let content = await this.io.read(asPng)

          if (asPng) {
            content = 'data:image/png;base64,' + content
          }

          const payload = { action: 'load', autosave: 0 }

          if (asPng) {
            (payload as any).xmlpng = content
          } else {
            (payload as any).xml = content
          }

          win.postMessage(JSON.stringify(payload), '*')
          this.io.setStatus('loaded')
        } else if (event === 'export') {
          this.logger.debug('export', msg.format)
          if ((asPng && msg.format === 'xmlpng') || (asSvg && msg.format === 'svg')) {
            await this.io.write(msg.data, true)
            this.io.setStatus('saved')
            win.postMessage(JSON.stringify({ action: 'status', modified: false }), '*')
          }
        } else if (event === 'save') {
          this.logger.debug('save', asPng)

          if (asPng || asSvg) {
            win.postMessage(JSON.stringify({
              xml: msg.xml,
              action: 'export',
              format: asPng ? 'xmlpng' : 'xmlsvg',
              border: 5,
              shadow: (window as any).drawioApp.editor.graph.shadowVisible,
              spin: 'Updating page',
            }), '*')
          } else {
            this.io.write(msg.xml)
            this.io.setStatus('saved')
          }
        } else if (event === 'exit') {
          this.logger.debug('exit')
          window.close()
        }
      } catch (error) {
        this.io.file.repo !== '__help__' && alert(error.message)
        throw error
      }
    }

    window.addEventListener('message', receive)
    iframe.setAttribute('src', DRAW_IFRAME_URL)
    document.body.appendChild(iframe)
  }
}

const editorContent = new EditorContent()
editorContent.init()
