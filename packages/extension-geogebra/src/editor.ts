import { BaseCustomEditorContent } from '@yank-note/runtime-api'

class EditorContent extends BaseCustomEditorContent {
  logger = this.ctx.utils.getLogger('geogebra-editor')

  contentType: string
  save = async () => {
    const api = (window as any).ggbApplet
    const content = api.getBase64(true)
    this.io.setStatus('unsaved')
    await this.io.write(content, true).catch(err => {
      this.logger.error('save failed', err)
      this.io.setStatus('save-failed')
      throw err
    })
    this.logger.debug('save')
    this.io.setStatus('saved')
    api.setSaved()
  }

  async init () {
    if (!this.io.file.path.endsWith('.ggb')) {
      return
    }

    // https://geogebra.github.io/docs/reference/en/GeoGebra_App_Parameters/
    const onChange = (api, force = false) => {
      if (api.isSaved() && !force) {
        return
      }

      this.logger.debug('change')
      this.io.setStatus('unsaved')
      this.triggerAutoSave()
    }

    const ggbBase64 = await this.io.read(true)

    const embedded = location.search.includes('embedded=true')

    const params = {
      app: !embedded,
      showToolBar: !embedded,
      showAlgebraInput: !embedded,
      showMenuBar: true,
      enableFileFeatures: false,
      showZoomButtons: true,
      autoHeight: true,
      useBrowserForJS: true,
      showResetIcon: true,
      ggbBase64,
      appletOnLoad: api => {
        api.registerAddListener(() => onChange(api))
        api.registerRemoveListener(() => onChange(api))
        api.registerRenameListener(() => onChange(api))
        api.registerClearListener(() => onChange(api))
        api.registerUpdateListener(() => onChange(api))
        api.registerClientListener((x) => {
          this.logger.debug(x)
          if (['undo', 'redo', 'setMode'].includes(x.type)) {
            onChange(api, true)
          }
        })
      }
    }
    const applet = new (window as any).GGBApplet(params, true)
    applet.setHTML5Codebase('../GeoGebra/HTML5/5.0/web3d/')
    applet.inject('app')
  }
}

const editorContent = new EditorContent()

editorContent.init()
