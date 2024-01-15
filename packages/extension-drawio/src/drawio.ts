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
  },
  setup (props) {
    const { t: _t, $t: _$t } = ctx.i18n.useI18n()

    const srcdoc = ref('')
    const xml = ref('')
    const refIFrame = ref<any>()

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

      return [
        h('div', { class: 'drawio-wrapper reduce-brightness', style: 'position: relative' }, [
          h(
            'div',
            { class: 'drawio-action skip-print' },
            [
              button($t.value('fit-height'), resize),
              button(_$t.value('reload'), reload),
              ...(drawioFile
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

export function MarkdownItPlugin (md: Markdown) {
  const render = ({ url, content, page = 1, env }: any) => {
    const currentFile = (env as RenderEnv).file
    if (url && currentFile) {
      const repo = FLAG_DEMO ? 'help' : currentFile.repo
      const path = url
      return h(DrawioComponent, { repo, path, name: basename(path), content, page })
    }

    return h(DrawioComponent, { content, page })
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

    return render({ url, page, env }) as any
  }

  const fenceTemp = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]

    const code = token.content.trim()
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
