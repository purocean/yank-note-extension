import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'
import type Markdown from '@yank-note/runtime-api/types/types/third-party/markdown-it'
import type { Doc, RenderEnv } from '@yank-note/runtime-api/types/types/renderer/types'
import i18n from './i18n'
import { buildEditorUrl } from './lib'

const api = ctx.api
const { $t } = i18n
const { defineComponent, h, ref, watch, onBeforeUnmount } = ctx.lib.vue
const { buildSrc, IFrame } = ctx.embed
const FLAG_DEMO = ctx.args.FLAG_DEMO
const { basename, join } = ctx.utils.path
const { openWindow } = ctx.env
const { emitResize } = ctx.layout

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
    sourceMap: Array as any as () => [number, number],
  },
  setup (props) {
    const { t: _t, $t: _$t } = ctx.i18n.useI18n()

    const srcdoc = ref('')
    const drawioContent = ref('')
    const refIFrame = ref<any>()
    const { Mask } = ctx.components
    const refFullIFrame = ref<any>()

    const fullScreenEditorContent = ref('')

    const topOffset = ctx.env.isElectron ? '30px' : '0px'

    const init = async () => {
      const { html, content } = await buildSrcdoc({
        repo: props.repo,
        path: props.path,
        content: props.content || '',
        page: props.page || 1,
      })
      srcdoc.value = html
      drawioContent.value = content
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

      const isBase64 = props.content && props.content.startsWith('data:')

      const vnode = [
        h('div', { class: 'drawio-wrapper reduce-brightness', style: 'position: relative' }, [
          h(
            'div',
            { class: 'drawio-action skip-print' },
            [
              button($t.value('fit-height'), resize),
              button(_$t.value('reload'), reload),
              ...(drawioFile && ctx.args.MODE === 'normal'
                ? [
                    button(_$t.value('edit'), () => {
                      ctx.doc.switchDoc(drawioFile!)
                      ctx.editor.switchEditor('drawio')
                    }),
                    button(_$t.value('open-in-new-window'), () => {
                      openWindow(buildEditorUrl(drawioFile!), '_blank', { alwaysOnTop: false })
                    }),
                  ]
                : [
                    ...(isBase64 ? [button(_$t.value('edit'), () => { fullScreenEditorContent.value = props.content! })] : []),
                    button(_$t.value('open-in-new-window'), () => openWindow(buildSrc(srcdoc.value, _t('view-figure')))),
                  ]
              ),
            ]
          ),
          h(IFrame, {
            html: srcdoc.value,
            'data-content': drawioContent.value,
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

      if (fullScreenEditorContent.value && !drawioFile && props.content) {
        vnode.unshift(h(Mask, {
          show: true,
          maskCloseable: false,
          escCloseable: false,
          style: { paddingTop: topOffset }
        }, [
          h('iframe', {
            src: buildEditorUrl(fullScreenEditorContent.value),
            ref: refFullIFrame,
            onLoad: (event) => {
              const iframe: HTMLIFrameElement = event.target as any
              iframe.contentWindow!.close = () => {
                fullScreenEditorContent.value = ''
              }

              (iframe.contentWindow as any)!.saveBase64ContentUrl = (content: string) => {
                if (!ctx.doc.isSameFile(ctx.store.state.currentFile, ctx.view.getRenderEnv()?.file) || !ctx.editor.isDefault()) {
                  ctx.ui.useToast().show('warning', 'Can not save the file in full screen mode')
                  return
                }

                if (!props.sourceMap || props.sourceMap.length < 2) {
                  return
                }

                const startLine = props.sourceMap[0] + 2
                const endLine = props.sourceMap[1] - 1

                const editor = ctx.editor.getEditor()
                const monaco = ctx.editor.getMonaco()
                const model = editor.getModel()
                const text = content.slice(content.indexOf(',') + 1)
                const range = new monaco.Range(startLine, 1, endLine, model!.getLineLength(endLine) + 1)

                editor.executeEdits('drawio', [{ range, text }])
              }
            },
            class: 'drawio-editor skip-print',
            style: { background: 'rgba(255, 255, 255, 0.5)', position: 'absolute', zIndex: 1, margin: 0, display: 'block', height: `calc(100vh - ${topOffset})` },
            width: '100%'
          }),
        ]))
      }

      return vnode
    }
  }
})

export function MarkdownItPlugin (md: Markdown) {
  const render = ({ url, content, page = 1, env, sourceMap }: any) => {
    const currentFile = (env as RenderEnv).file
    if (url && currentFile) {
      let path: string
      if (url.startsWith('/api/attachment/')) {
        const params = new URLSearchParams(url.replace(/^.*\?/, ''))
        path = params.get('path') || ''
      } else {
        const basePath = ctx.utils.path.dirname(currentFile.path)
        path = ctx.utils.path.resolve(basePath, decodeURIComponent(url))
      }

      const repo = FLAG_DEMO ? 'help' : currentFile?.repo
      return h(DrawioComponent, { repo, path, name: basename(path), content, page })
    }

    return h(DrawioComponent, { content, page, sourceMap })
  }

  const linkTemp = md.renderer.rules.link_open!.bind(md.renderer.rules)
  md.renderer.rules.link_open = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]

    if (token.attrGet('link-type') !== 'drawio') {
      return linkTemp(tokens, idx, options, env, slf)
    }

    const url = token.attrGet('href') || ''
    const page = parseInt(token.attrGet('page') || '1', 10)
    const nextToken = tokens[idx + 1]
    if (nextToken && nextToken.type === 'text') {
      nextToken.content = ''
    }

    return render({ url, page, env }) as any
  }

  const fenceTemp = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]

    const code = token.content.trim()

    if (token.info === 'diagram') { // for wiki.js
      let content = code
      if (content && !content.startsWith('data:')) {
        content = 'data:image/svg+xml;base64,' + content
      }
      return render({ content, env, sourceMap: token.map }) as any
    }

    const firstLine = code.split(/\n/)[0].trim()
    if (token.info !== 'xml' || !firstLine.includes('--drawio--')) {
      return fenceTemp(tokens, idx, options, env, slf)
    }

    return render({ content: code, env }) as any
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

  const isBase64 = content.startsWith('data:')

  const div = document.createElement('div')
  div.className = 'mxgraph'
  div.dataset.mxgraph = JSON.stringify({
    highlight: '#00afff',
    lightbox: false,
    nav: true,
    resize: true,
    toolbar: 'pages zoom layers',
    page: page - 1, // page start from 0
    xml: isBase64 ? undefined : content,
    url: isBase64 ? content : undefined,
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
