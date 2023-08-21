import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'
import type Markdown from '@yank-note/runtime-api/types/types/third-party/markdown-it'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import i18n from './i18n'

const api = ctx.api
const { $t, t } = i18n
const store = ctx.store
const { defineComponent, h, ref, watch, onBeforeUnmount } = ctx.lib.vue
const { buildSrc, IFrame } = ctx.embed
const FLAG_DEMO = ctx.args.FLAG_DEMO
const { useModal, useToast } = ctx.ui
const refreshTree = ctx.tree.refreshTree
const { basename, join } = ctx.utils.path
const { isElectron, openWindow } = ctx.env
const { emitResize } = ctx.layout
const { Mask } = ctx.components

type F = { repo?: string; path?: string; url?: string; content: string; page: number }

const extensionId = __EXTENSION_ID__

const BASE_URL = location.origin + join(getExtensionBasePath(extensionId), 'drawio/src/main/webapp')

const DrawioComponent = defineComponent({
  name: 'extension-drawio',
  props: {
    repo: String,
    path: String,
    name: String,
    content: String,
    page: Number,
  },
  setup (props) {
    const { t: _t, $t: _$t } = ctx.i18n.useI18n()

    const srcdoc = ref('')
    const xml = ref('')
    const refIFrame = ref<any>()
    const refFullIFrame = ref<any>()
    const fullScreen = ref(false)

    const init = async () => {
      const { html, content } = await buildSrcdoc({
        repo: props.repo,
        path: props.path,
        content: props.content || '',
        page: props.page || 1,
      })
      srcdoc.value = html
      xml.value = content
    }

    watch(props, init, { immediate: true })

    const resize = () => {
      const iframe = refIFrame.value.getIframe()
      if (iframe && iframe.contentDocument.body) {
        iframe.contentDocument.body.style.height = 'auto'
        iframe.contentDocument.documentElement.style.height = 'auto'
        iframe.height = iframe.contentDocument.documentElement.offsetHeight + 'px'
        iframe.contentDocument.body.style.height = iframe.contentDocument.body.clientHeight + 'px'
        iframe.contentDocument.documentElement.style.height = '100%'
        emitResize()
      }
    }

    const reload = async () => {
      const oldSrc = srcdoc.value
      await init()
      if (oldSrc === srcdoc.value) {
        refIFrame.value.reload()
      }
    }

    let timer: any

    onBeforeUnmount(() => {
      timer && clearTimeout(timer)
    })

    const button = (text: string, onClick: any) => h('button', {
      class: 'small',
      onClick
    }, text)

    if (FLAG_DEMO) {
      watch([refFullIFrame, refIFrame], () => {
        document.querySelectorAll('iframe.drawio-editor').forEach(x => {
          (x as any).contentWindow.fetch = window.fetch
        })
      })
    }

    watch(srcdoc, (val) => {
      timer && clearTimeout(timer)
      timer = null
      if (val) {
        timer = setTimeout(resize, 1000)
      }
    })

    onBeforeUnmount(() => {
      timer && clearTimeout(timer)
    })

    return () => {
      let drawioFile: Doc | undefined
      if (props.repo && props.path) {
        drawioFile = { name: props.name || 'diagram.drawio', type: 'file', repo: props.repo, path: props.path }
      }

      const topOffset = isElectron ? '30px' : '0px'

      return [
        fullScreen.value && drawioFile && h(Mask, {
          show: true,
          maskCloseable: false,
          escCloseable: false,
          style: { paddingTop: topOffset }
        }, [
          h(IFrame, {
            html: buildEditorSrcdoc(drawioFile),
            ref: refFullIFrame,
            onLoad: (iframe) => {
              iframe.contentWindow!.close = () => {
                fullScreen.value = false
                reload()
              }
            },
            iframeProps: {
              class: 'drawio-editor skip-print',
              style: { background: 'rgba(255, 255, 255, 0.5)', position: 'absolute', zIndex: 1, margin: 0, display: 'block', height: `calc(100vh - ${topOffset})` },
              width: '100%'
            },
          }),
        ]),

        h('div', { class: 'drawio-wrapper reduce-brightness', style: 'position: relative' }, [
          h(
            'div',
            { class: 'drawio-action skip-print' },
            [
              button($t.value('fit-height'), resize),
              button(_$t.value('reload'), reload),
              ...(drawioFile
                ? [
                    button(_$t.value('edit'), () => { fullScreen.value = true }),
                    button(_$t.value('open-in-new-window'), () => {
                      openWindow(buildSrc(buildEditorSrcdoc(drawioFile!), t('edit-diagram', drawioFile!.name)), '_blank', { alwaysOnTop: false })
                    }),
                  ]
                : [
                    button(_$t.value('open-in-new-window'), () => openWindow(buildSrc(srcdoc.value, _t('view-figure')))),
                  ]
              ),
            ]
          ),
          h(IFrame, {
            html: srcdoc.value,
            'data-xml': xml.value,
            ref: refIFrame,
            onLoad: () => {
              resize()
            },
            iframeProps: {
              class: 'drawio',
              height: '300px',
              style: { background: '#fff', },
            },
          })
        ])
      ]
    }
  }
})

export const CUSTOM_EDITOR_IFRAME_ID = 'custom-editor-drawio'

export function MarkdownItPlugin (md: Markdown) {
  const render = ({ url, content, page = 1 }: any) => {
    if (url) {
      const params = new URLSearchParams(url.replace(/^.*\?/, ''))
      const repo = FLAG_DEMO ? 'help' : (params.get('repo') || store.state.currentFile?.repo || '')
      const path = params.get('path') || ''
      return h(DrawioComponent, { repo, path, name: basename(path), content, page })
    }

    return h(DrawioComponent, { url, content, page })
  }

  const linkTemp = md.renderer.rules.link_open!.bind(md.renderer.rules)
  md.renderer.rules.link_open = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]

    if (token.attrGet('link-type') !== 'drawio') {
      return linkTemp(tokens, idx, options, env, slf)
    }

    const url = token.attrGet('href')
    const page = parseInt(token.attrGet('page') || '1', 10)
    const nextToken = tokens[idx + 1]
    if (nextToken && nextToken.type === 'text') {
      nextToken.content = ''
    }

    return render({ url, page }) as any
  }

  const fenceTemp = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]

    const code = token.content.trim()
    const firstLine = code.split(/\n/)[0].trim()
    if (token.info !== 'xml' || !firstLine.includes('--drawio--')) {
      return fenceTemp(tokens, idx, options, env, slf)
    }

    return render({ content: code }) as any
  }
}

export async function buildSrcdoc ({ repo, path, content, page }: F): Promise<{ html: string, content: string }> {
  if (!content && repo && path) {
    try {
      if (!path.endsWith('.drawio')) {
        return { html: 'Error: support drawio file only', content: '' }
      }

      content = (await api.readFile({ repo, path })).content
    } catch (error: any) {
      return { html: error.message, content: '' }
    }
  }

  content = content.replace(/<!--.*?-->/gs, '').trim()

  const div = document.createElement('div')
  div.className = 'mxgraph'
  div.dataset.mxgraph = JSON.stringify({
    highlight: '#00afff',
    lightbox: false,
    nav: true,
    resize: true,
    toolbar: 'pages zoom layers',
    page: page - 1, // page start from 0
    xml: content,
  })

  const html = `
    <script>
      window._requestAnimationFrameCount = 0
      window._requestAnimationFrame = window.requestAnimationFrame
      window._requestAnimationFrameTask = null

      window.addEventListener('mousemove', () => {
        window._requestAnimationFrameCount = 0
        if (window._requestAnimationFrameTask) {
          window._requestAnimationFrameTask()
          window._requestAnimationFrameTask = null
        }
      })

      window.requestAnimationFrame = function (fn) {
        if (window._requestAnimationFrameCount < 200) {
          window._requestAnimationFrameCount++
          window._requestAnimationFrameTask = null
          return window._requestAnimationFrame(fn)
        } else {
          window._requestAnimationFrameTask = fn
        }
      }

      window.DRAWIO_BASE_URL = '${BASE_URL}'
      window.SHAPES_PATH = '${BASE_URL}/shapes'
      window.STENCIL_PATH = '${BASE_URL}/stencils'
      window.GRAPH_IMAGE_PATH = '${BASE_URL}/img'
      window.mxImageBasePath = '${BASE_URL}/mxgraph/images'
      window.mxBasePath = '${BASE_URL}/mxgraph/'
    </script>

    <style>
      ::selection {
        background: #d3d3d3;
      }

      ::-webkit-scrollbar {
        width: 7px;
        height: 7px;
      }

      ::-webkit-scrollbar-track {
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1);
      }

      ::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.09);
        box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.1);
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .mxgraph {
        max-width: 100%;
      }

      .geDiagramContainer {
        max-width: 100%;
        max-height: 100%;
      }

      body {
        background: #fff;
      }
    </style>
    ${div.outerHTML}
    <script src="${BASE_URL}/js/viewer.min.js"></script>
  `

  return { html, content }
}

export function supported (file?: Doc | null) {
  return !!(file && (file.path.endsWith('.drawio') || file.path.endsWith('.drawio.png')))
}

export function buildEditorSrcdoc (file: Doc, showExit = true) {
  if (FLAG_DEMO) {
    file.repo = 'help'
  }

  return `
    <style>
      html, body {
        height: 100%;
        padding: 0;
        margin: 0;
      }
    </style>
    <script>
      function init (doc) {
        const DRAW_IFRAME_URL = '${BASE_URL}/index.html?embed=1&proto=json${!showExit ? '&noExitBtn=1' : ''}';

        const iframe = document.createElement('iframe')
        iframe.style.boxSizing = 'border-box'
        iframe.style.display = 'block'
        iframe.style.width = '100vw'
        iframe.style.height = '100vh'
        iframe.style.border = 'none'
        iframe.setAttribute('frameborder', '0')
        iframe.addEventListener('load', () => {
          iframe.contentWindow.EXPORT_URL = 'https://convert.diagrams.net/node/export?__allow-open-window__'
        })

        ${
          isElectron
            ? `
              window.onbeforeunload = evt => {
                iframe.contentWindow.postMessage(JSON.stringify({ action: 'exit' }), '*');
              }
            `
            : ''
        }

        const asPng = doc.path.endsWith('.png')

        const receive = async function (evt) {
          try {
            if (evt.data.length < 1) {
              return
            }

            const msg = JSON.parse(evt.data)
            const { event } = msg

            if (event === 'init') {
              // hack for get editorUI
              const _updateActionStates = iframe.contentWindow.App.prototype.updateActionStates
              iframe.contentWindow.App.prototype.updateActionStates = function () {
                window.drawioApp = this
                iframe.contentWindow.App.prototype.updateActionStates = _updateActionStates
                return _updateActionStates.apply(this, arguments)
              }

              window.getIsDirty = function () {
                return window.drawioApp.editor.modified
              }

              let { content, hash } = await window.embedCtx.api.readFile(doc, asPng)
              doc.contentHash = hash

              if (asPng) {
                content = 'data:image/png;base64,' + content
              }

              const payload ={ action: 'load', autosave: 0 }

              if (asPng) {
                payload.xmlpng = content
              } else {
                payload.xml = content
              }

              iframe.contentWindow.postMessage(JSON.stringify(payload), '*')
            } else if (event === 'export') {
              console.log('export', msg.format)
              if (asPng && msg.format === 'xmlpng') {
                const { hash } = await window.embedCtx.api.writeFile(doc, msg.data, true)
                doc.contentHash = hash
                iframe.contentWindow.postMessage(JSON.stringify({ action: 'status', modified: false }), '*');
              }
            } else if (event === 'save') {
              console.log('save', asPng)

              if (asPng) {
                iframe.contentWindow.postMessage(JSON.stringify({
                  xml: msg.xml,
                  action: 'export',
                  format: 'xmlpng',
                  spin: 'Updating page',
                }), '*');
              } else {
                const { hash } = await window.embedCtx.api.writeFile(doc, msg.xml)
                doc.contentHash = hash
              }
            } else if (event === 'exit') {
              console.log('exit')
              window.close()
            }
          } catch (error) {
            doc.repo !== '__help__' && alert(error.message)
            throw error
          }
        }

        window.addEventListener('message', receive)
        iframe.setAttribute('src', DRAW_IFRAME_URL)
        document.body.appendChild(iframe)
      }

      window.addEventListener('load', () => init(${JSON.stringify(file)}))
    </script>
  `
}

export async function createDrawioFile (node: Doc, fileExt: '.drawio' | '.drawio.png') {
  const currentPath = node.path

  let filename = await useModal().input({
    title: t('create-drawio-file', fileExt),
    hint: ctx.i18n.t('document.create-dialog.hint'),
    content: ctx.i18n.t('document.current-path', currentPath),
    value: 'new-diagram' + fileExt,
    select: true
  })

  if (!filename) {
    return
  }

  if (!filename.endsWith(fileExt)) {
    filename = filename.replace(/\/$/, '') + fileExt
  }

  const path = join(currentPath, filename)

  if (!path) {
    throw new Error('Need Path')
  }

  const file: Doc = { repo: node.repo, path: path, type: 'file', name: '', contentHash: 'new' }
  let isBase64: boolean
  let content: string

  if (fileExt === '.drawio.png') {
    isBase64 = true
    content = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHkAAAA9CAYAAACJM8YzAAAAAXNSR0IArs4c6QAAA0B0RVh0bXhmaWxlACUzQ214ZmlsZSUyMGhvc3QlM0QlMjJlbWJlZC5kaWFncmFtcy5uZXQlMjIlMjBtb2RpZmllZCUzRCUyMjIwMjItMDEtMTFUMDglM0EyNCUzQTEyLjA2NFolMjIlMjBhZ2VudCUzRCUyMjUuMCUyMChNYWNpbnRvc2glM0IlMjBJbnRlbCUyME1hYyUyME9TJTIwWCUyMDEwXzE1XzcpJTIwQXBwbGVXZWJLaXQlMkY1MzcuMzYlMjAoS0hUTUwlMkMlMjBsaWtlJTIwR2Vja28pJTIwQ2hyb21lJTJGOTcuMC40NjkyLjcxJTIwU2FmYXJpJTJGNTM3LjM2JTIyJTIwZXRhZyUzRCUyMlZielhWTkZVWXg4d1B1S1M2dGdRJTIyJTIwdmVyc2lvbiUzRCUyMjE2LjIuNCUyMiUyMHR5cGUlM0QlMjJlbWJlZCUyMiUzRSUzQ2RpYWdyYW0lMjBpZCUzRCUyMmluTVBjall2bm12bXh6aERLTFBOJTIyJTIwbmFtZSUzRCUyMlBhZ2UtMSUyMiUzRWpaSk5iNFFnRUlaJTJGRFhlVjFOMWVhJTJCM3VZWnNlUFBSTVpDb2tJSWJGVmZ2cmkyWHdJNlpKTDJibW1SbDU1d1ZDQ3oxZUxPdkV1JTJCR2dTSmJ3a2RCWGttVTVQZnZ2REtZQXpna05vTEdTQjVTdW9KTGZnREJCMmtzTzkxMmpNMFk1MmUxaGJkb1dhcmRqekZvejdOdSUyQmpOcWYyckVHRHFDcW1UclNUOG1kd0MyeTA4cXZJQnNSVDA3ejUxRFJMRGJqSm5mQnVCazJpSmFFRnRZWUZ5STlGcUJtNzZJdlllN3RqJTJCb2l6RUxyJTJGak9RaFlFSFV6M3VkaTF2dHc4VTU2YTRzVFY5eTJFZVNnaDlHWVIwVUhXc25xdUR2MkxQaE5QS1o2a1BqeUpRMXdPc2czR0RVTlFGakFabko5JTJCQzFjVWdmQ0hwRSUyQmJENm5jYWU4VEc2eHdad3l0dWxsJTJCdkx2Z0FqWWpwYXZodmJmTnFhZmtEJTNDJTJGZGlhZ3JhbSUzRSUzQyUyRm14ZmlsZSUzRTVX5JYAAAOnSURBVHhe7do9KLVhGAfw/4kkIhkoRfmaFEWUJIswyGxQFrEYLCgiBhHKUQZlowxSFgYZGJAM7IqEwccgH4uPeLvuXqfzvIec+015rnP/7zKd6xzX/f+d67mfp04AwDu4YjqBgCC/v9M5VpUDgQCIHKu6f/dF5BgHlu0RmcgOJODAFjnJRHYgAQe2yEkmsgMJOLBFTjKRHUjAgS1ykonsQAIObJGTTGQHEnBgi5xkIjuQgANb5CQT2YEEHNgiJ5nIDiTgwBY5yUR2IAEHtshJjhL57e0Np6enSExMRFZWVpTv8keZGuT8/Hz09vaivb09lNzBwQHKyspwc3OD5ORkJCUlfZrq0tISSktLUVBQgJOTE+Tm5nrqFhYW0NfXh/Pz84j3y+/Rx8bGMDo6ioeHB/N6SkoKJiYm0NHR4Q/Fb7pQhdzT0+MJ9gP5+vraIMvfysoKSkpKPNvOyMjA5eWlQT4+PkZeXp7n9fn5eXR3d+Pq6ioiroGBAUxPT2NxcRH19fWQiV5eXkZLSwumpqbQ1dXle+iYQ97f30d5eXlE8IJri3x7e4v09HTMzc2hra3N85mDg4MIBoO4u7szv2v281KFXFRUhKqqqlCeFxcXmJmZQfgkDw8Po7CwMFQjG2xubjYTbIu8t7eHyspKnJ2dITs72+O4vb2N6upqM/1ypfDzUoUcHx8POZs/lkyaQIQjy6U4LS0tVBMXFweZ7v9BXltbQ2NjI+7v7805HL52d3fNF+6zM95v4KqQozmTf/JyfXh4aG7YNjY2UFtb67EbHx83N4JPT09ISEjwm6unHyID+OrG6/Hx0Uyw3JQJaviqq6vDy8sLNjc3fQ0szcUcsjwOFRcXe4KX51q5QZIzeXV11XO+ZmZmYn19HZ2dnZBzNnzJ0TA5OYmhoSHI5zY1NeH19RWzs7Po7+/H1tYWampqiPxTCUjgX12uv3tOlpuzhoYGg/zvkudf+RK0trZGvLazs4OKigqMjIwY6I8lN1qCLtOsYamZ5N8O8/n5GUdHR0hNTUVOTs5vt2P1/4lsFZfOYiLrdLPqmshWceksJrJON6uuiWwVl85iIut0s+qayFZx6Swmsk43q66JbBWXzmIi63Sz6prIVnHpLCayTjerrolsFZfOYiLrdLPqmshWceksJrJON6uuiWwVl85iIut0s+qayFZx6Swmsk43q66JbBWXzmIi63Sz6prIVnHpLCayTjerrolsFZfO4hCyzvbZdbQJ/AFkdDUfctJpxQAAAABJRU5ErkJggg=='
  } else {
    isBase64 = false
    content = '<mxfile host="embed.diagrams.net" modified="2022-01-11T08:20:21.828Z" agent="5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36" etag="EEjUkbc3rjhjUWmDhpO0" version="16.2.4" type="embed"><diagram id="inMPcjYvnmvmxzhDKLPN" name="Page-1">jZJNb4QgEIZ/DXeV1N1ea+3uYZsePPRMZCokIIbFVfvri2XwI6ZJL2bmmRl55wVCCz1eLOvEu+GgSJbwkdBXkmU5PfvvDKYAzgkNoLGSB5SuoJLfgDBB2ksO912jM0Y52e1hbdoWardjzFoz7Nu+jNqf2rEGDqCqmTrST8mdwC2y08qvIBsRT07z51DRLDbjJnfBuBk2iJaEFtYYFyI9FqBm76IvYe7tj+oizELr/jOQhYEHUz3udi1vtw8U56a4sTV9y2EeSgh9GYR0UHWsnquDv2LPhNPKZ6kPjyJQ1wOsg3GDUNQFjAZnJ9+C1cUgfCHpE+bD6ncae8TG6xwZwytull+vLvgAjYjpavhvbfNqafkD</diagram></mxfile>'
  }

  try {
    await api.writeFile(file, content, isBase64)
    const srcdoc = buildEditorSrcdoc(file)
    openWindow(buildSrc(srcdoc, t('edit-diagram', file.name)), '_blank', { alwaysOnTop: false })
    refreshTree()
  } catch (error: any) {
    useToast().show('warning', error.message)
    console.error(error)
  }
}
