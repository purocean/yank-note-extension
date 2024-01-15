import { BaseCustomEditorContent, getExtensionBasePath } from '@yank-note/runtime-api'

class EditorContent extends BaseCustomEditorContent {
  logger = this.ctx.utils.getLogger('drawio-editor')

  contentType: string
  save = () => Promise.resolve()

  init () {
    const BASE_URL = location.origin + this.ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), 'drawio/src/main/webapp')
    const inIframe = !!window.parent

    const DRAW_IFRAME_URL = `${BASE_URL}/index.html?embed=1&proto=json${inIframe ? '&noExitBtn=1' : ''}`

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

    const asPng = this.io.file.path.endsWith('.png')

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
          win.App.prototype.updateActionStates = function (...args: any[]) {
            (window as any).drawioApp = this
            win.App.prototype.updateActionStates = _updateActionStates

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
          if (asPng && msg.format === 'xmlpng') {
            await this.io.write(msg.data, true)
            this.io.setStatus('saved')
            win.postMessage(JSON.stringify({ action: 'status', modified: false }), '*')
          }
        } else if (event === 'save') {
          this.logger.debug('save', asPng)

          if (asPng) {
            win.postMessage(JSON.stringify({
              xml: msg.xml,
              action: 'export',
              format: 'xmlpng',
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
