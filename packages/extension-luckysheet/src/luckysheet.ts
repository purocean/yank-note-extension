import type Markdown from '@yank-note/runtime-api/types/types/third-party/markdown-it'
import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'
import i18n from './i18n'

const { defineComponent, h, ref, watch } = ctx.lib.vue
const { t } = i18n
const { useModal, useToast } = ctx.ui
const { isElectron, openWindow } = ctx.env
const { useI18n, t: _t, getCurrentLanguage } = ctx.i18n
const { IFrame, buildSrc } = ctx.embed
const { Mask } = ctx.components
const { dirname, join } = ctx.utils.path

export const fileExt = '.luckysheet'
const extensionId = __EXTENSION_ID__
const logger = ctx.utils.getLogger(extensionId)

export function buildSrcdoc (repo: string, path: string, full: boolean) {
  if (!path.endsWith('.luckysheet')) {
    return 'Error: support luckysheet file only'
  }

  const lang = getCurrentLanguage() === 'zh-CN' ? 'zh' : 'en'
  const options = { container: 'lucky-sheet', lang, plugins: ['chart'], showtoolbarConfig: { print: false } }
  let onload = ''

  if (full) {
    onload = `
      const btn = document.createElement('button');
      btn.style = 'border-radius: 4px;border: 0; background: #d3d4d5; cursor: pointer; margin-left: 10px; color: #24292f; padding: 4px 8px;';
      btn.innerText = '${_t('save')}'
      btn.onclick = save
      document.querySelector('.luckysheet_info_detail .sheet-name').after(btn)
      document.querySelector('.luckysheet_info_detail .luckysheet_info_detail_update').innerText = '${path}'
      setStatus('${_t('file-status.loaded')}')

      ${isElectron
        ? `
          let closeWindow = false
          const remote = window.nodeRequire && window.nodeRequire('@electron/remote')
          window.onbeforeunload = evt => {
            if (saved() || closeWindow) return null

            if (!remote) {
              return true
            }

            evt.returnValue = true

            setTimeout(() => {
              let result = remote.dialog.showMessageBoxSync({
                type: 'question',
                cancelId: 1,
                message: '${_t('quit-check-dialog.desc')}',
                buttons: ['${_t('quit-check-dialog.buttons.discard')}', '${_t('quit-check-dialog.buttons.cancel')}']
              })

              if (result === 0) {
                closeWindow = true
                remote.getCurrentWindow().close()
              }
            })
          }`
          : 'window.onbeforeunload = () => saved() ? null : true'
      }

      window.addEventListener('keydown', e => {
        const isMacOS = /macintosh|mac os x/i.test(navigator.userAgent)
        const ctrl = isMacOS ? e.metaKey : e.ctrlKey
        if (ctrl && e.code === 'KeyS') {
          save()
          e.stopPropagation()
          e.preventDefault()
        }
      })
    `
    Object.assign(options, {})
  } else {
    Object.assign(options, {
      showtoolbar: false,
      showinfobar: false,
      allowEdit: false,
      showsheetbarConfig: {
        add: false,
        menu: false,
        sheet: true
      },
      sheetRightClickConfig: {
        delete: false,
        copy: false,
        rename: false,
        color: false,
        hide: false,
        move: false,
      },
    })
  }

  const baseUrl = getExtensionBasePath(extensionId) + '/luckysheet'

  return `
    <link rel="stylesheet" href="${baseUrl}/plugins/css/pluginsCss.css" />
    <link rel="stylesheet" href="${baseUrl}/plugins/plugins.css" />
    <link rel="stylesheet" href="${baseUrl}/css/luckysheet.css" />
    <link rel="stylesheet" href="${baseUrl}/assets/iconfont/iconfont.css" />
    <link rel="stylesheet" href="${baseUrl}/expendPlugins/chart/chartmix.css" />
    <style>
      html, body {
        height: 100%;
        padding: 0;
        margin: 0;
      }

      .luckysheet_info_detail_back ,
      .luckysheet_info_detail .sheet-name {
        display: none;
      }

      .luckysheet_info_detail .luckysheet_info_detail_update {
        font-size: 18px;
        color: #222;
      }
    </style>
    <div id="lucky-sheet" style="height: 100%"></div>
    <script src="${baseUrl}/plugins/js/plugin.js"></script>
    <script src="${baseUrl}/luckysheet.umd.js"></script>
    <script>
      window.getStatus = () => document.querySelector('.luckysheet_info_detail .luckysheet_info_detail_save').innerText
      window.setStatus = str => document.querySelector('.luckysheet_info_detail .luckysheet_info_detail_save').innerText = str
      window.saved = () => getStatus().startsWith('${t('saved-at')}') || getStatus() === '${_t('file-status.loaded')}'

      async function readFile (repo, path) {
        try {
          if (embedCtx.args.FLAG_DEMO) {
            repo = 'help'
          }

          const { hash, content } = await embedCtx.api.readFile({ repo, path })

          window.hash = hash

          return content
        } catch (error) {
          document.getElementById('lucky-sheet').innerHTML = error.message
        }
      }

      async function writeFile (repo, path, content) {
        try {
          return await embedCtx.api.writeFile({ repo, path, contentHash: window.hash }, content)
        } catch (error) {
          repo !== '__help__' &&  alert(error.message)
          throw error
        }
      }

      function workbookCreateAfter () {
        ${onload}
      }

      const path = '${path}'
      const repo = '${repo}'

      async function save () {
        try {
          setStatus('${_t('file-status.saving')}...')
          await writeFile(repo, path, JSON.stringify(window.luckysheet.getAllSheets()))
          setStatus('${t('saved-at')}: ' + (new Date()).toLocaleString())
          await readFile(repo, path)
        } catch (error) {
          setStatus('${_t('file-status.save-failed')}: ' + error.message)
        }
      }

      async function init () {
        const options = ${JSON.stringify(options)}
        options.hook = {
          workbookCreateAfter,
          updated () {
            setStatus('${_t('file-status.unsaved')}')
          }
        }

        const content = await readFile(repo, path)

        options.data = JSON.parse(content)
        window.luckysheet.create(options)
      }

      window.addEventListener('load', init)
    </script>
  `
}

export const LuckyComponent = defineComponent({
  name: 'lucky-sheet',
  props: {
    repo: String,
    path: String
  },
  setup (props) {
    logger.debug('setup', props)

    const { $t } = useI18n()

    const srcdoc = ref('')
    const refIFrame = ref<any>()
    const refFullIFrame = ref<any>()
    const fullScreen = ref(false)

    const update = () => {
      srcdoc.value = buildSrcdoc(props.repo!, props.path!, false)
    }

    const reload = () => {
      refIFrame.value.reload()
    }

    const open = () => {
      fullScreen.value = true
    }

    const close = async () => {
      try {
        refFullIFrame.value.close()
        fullScreen.value = false
      } catch {
        if (await useModal().confirm({ title: _t('quit-check-dialog.title'), content: _t('quit-check-dialog.desc') })) {
          fullScreen.value = false
        }
      }
    }

    watch(props, update, { immediate: true })

    if (ctx.args.FLAG_DEMO) {
      watch([refFullIFrame, refIFrame], () => {
        if (refIFrame.value) {
          refIFrame.value.reload = () => {
            useToast().show('warning', _t('demo-tips'))
          }
        }

        document.querySelectorAll('iframe.lucky-sheet').forEach(x => {
          (x as any).contentWindow.fetch = window.fetch
        })
      })
    }

    const button = (text: string, onClick: any) => h('button', {
      class: 'small',
      onClick
    }, text)

    const topOffset = isElectron ? '30px' : '0px'

    const buildIFrame = (full: boolean) => h(IFrame, {
      ref: full ? refFullIFrame : refIFrame,
      html: buildSrcdoc(props.repo!, props.path!, full),
      debounce: 1000,
      iframeProps: {
        class: 'lucky-sheet',
        style: 'background: #fff; margin: 0;display:block;height: ' + (full ? `calc(100vh - ${topOffset})` : '500px'),
        width: '100%'
      }
    })

    return () => [
      fullScreen.value && h(Mask, {
        show: true,
        maskCloseable: false,
        escCloseable: false,
        style: { paddingTop: topOffset }
      }, [
        h(
          'div',
          {
            class: 'skip-print',
            style: 'position: absolute; right: 10px; margin-top: 15px; z-index: 1;'
          },
          button($t.value('close'), close),
        ),
        buildIFrame(true),
      ]),

      h('div', { class: 'lucky-sheet-wrapper reduce-brightness', style: 'position: relative' }, [
        h(
          'div',
          { class: 'lucky-sheet-action skip-print' },
          [
            button($t.value('reload'), reload),
            button($t.value('edit'), open),
            button($t.value('open-in-new-window'), () => {
              const html = buildSrcdoc(props.repo!, props.path!, true)
              openWindow(buildSrc(html, t('edit-sheet'), false), '_blank', {
                alwaysOnTop: false,
                contextIsolation: false,
              })
            }),
          ]
        ),
        buildIFrame(false)
      ])
    ]
  }
})

export const MarkdownItPlugin = (md: Markdown) => {
  const linkTemp = md.renderer.rules.link_open!.bind(md.renderer.rules)
  md.renderer.rules.link_open = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]

    if (token.attrGet('link-type') !== 'luckysheet') {
      return linkTemp(tokens, idx, options, env, slf)
    }

    const { currentFile } = ctx.store.state
    if (!currentFile) {
      return linkTemp(tokens, idx, options, env, slf)
    }

    const url = token.attrGet(ctx.args.DOM_ATTR_NAME.ORIGIN_HREF) || token.attrGet('href')
    if (!url || url.includes(':')) {
      return linkTemp(tokens, idx, options, env, slf)
    }

    const path = url.startsWith('/') ? url : join(dirname(currentFile.path), url)

    const nextToken = tokens[idx + 1]
    if (nextToken && nextToken.type === 'text') {
      nextToken.content = ''
    }

    return h(LuckyComponent, { repo: currentFile.repo, path }) as any
  }
}

export async function createLuckysheet (node: Doc) {
  const currentPath = node.path

  let filename = await useModal().input({
    title: t('create-dialog-title'),
    hint: _t('document.create-dialog.hint'),
    content: _t('document.current-path', currentPath),
    value: 'new-sheet' + fileExt,
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

  if (typeof file.content !== 'string') {
    file.content = JSON.stringify([{
      name: 'Sheet1',
      color: '',
      status: 1,
      order: 0,
      data: Array(20).fill(Array(14).fill(null)),
      config: {
        merge: {},
        rowlen: {},
        rowhidden: {}
      },
      index: 0,
      jfgird_select_save: [],
      luckysheet_select_save: [{
        row: [0, 0],
        column: [0, 0],
        row_focus: 0,
        column_focus: 0,
        left: 0,
        width: 73,
        top: 0,
        height: 19,
        left_move: 0,
        width_move: 73,
        top_move: 0,
        height_move: 19
      }],
      visibledatarow: [],
      visibledatacolumn: [],
      ch_width: 4560,
      rh_height: 1760,
      luckysheet_selection_range: [],
      zoomRatio: 1,
      scrollLeft: 0,
      scrollTop: 0,
      calcChain: [],
      filter_select: null,
      filter: null,
      luckysheet_conditionformat_save: [],
      luckysheet_alternateformat_save: [],
      dataVerification: {},
      hyperlink: {},
      celldata: []
    }])
  }

  try {
    await ctx.api.writeFile(file, file.content)
    const srcdoc = buildSrcdoc(file.repo, file.path, true)
    openWindow(buildSrc(srcdoc, t('edit-sheet'), false), '_blank', {
      alwaysOnTop: false,
      contextIsolation: false,
    })
    ctx.tree.refreshTree()
  } catch (error: any) {
    useToast().show('warning', error.message)
    console.error(error)
  }
}
