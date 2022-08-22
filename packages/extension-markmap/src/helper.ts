import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

export function buildHTML () {
  const baseUrl = getExtensionBasePath(extensionId)

  return `
    <style>
      html, body {
        padding: 0;
        margin: 0;
      }
    </style>
    <link rel="stylesheet" href="${baseUrl}/dist/markmap-toolbar.css">
    <script src="${baseUrl}/dist/d3.min.js"></script>
    <script src="${baseUrl}/dist/markmap-view.min.js"></script>
    <script src="${baseUrl}/dist/markmap-lib.min.js"></script>
    <script src="${baseUrl}/dist/markmap-toolbar.umd.min.js"></script>

    <svg xmlns="http://www.w3.org/2000/svg" id="markmap" style="width: 100%; height: 100vh; display: block;"></svg>
    `
}

export function transformLink (nodes: HTMLElement[]) {
  const convertLink = (link: string) => {
    if (!link) {
      return link
    }

    const { repo, path, name } = ctx.store.state.currentFile || {}
    if (!repo || !path || !name) {
      return link
    }

    if (/^[^:]*:/.test(link) || link.startsWith('//')) { // xxx:
      return link
    }

    const basePath = ctx.utils.path.dirname(path)
    const fileName = ctx.utils.path.basename(ctx.utils.removeQuery(link))

    // keep markdown file.
    if (fileName.endsWith('.md')) {
      return link
    }

    // keep anchor hash.
    if (link.indexOf('#') > -1) {
      return link
    }

    const originPath = ctx.utils.removeQuery(link)

    const filePath = ctx.utils.path.resolve(basePath, originPath)
    return `/api/attachment/${encodeURIComponent(fileName)}?repo=${repo}&path=${encodeURIComponent(filePath)}`
  }

  nodes.forEach(node => {
    const imgs = node.querySelectorAll('img')
    imgs.forEach(img => {
      const src = img.getAttribute('src')
      if (src && !src.startsWith('/api/attachment')) {
        img.setAttribute('src', convertLink(src))
      }
    })

    const links = node.querySelectorAll('a')
    links.forEach(link => {
      link.target = '_blank'
    })
  })
}

export function handleLink (e: MouseEvent) {
  const getElement = (id: string) => {
    id = id.replace(/%28/g, '(').replace(/%29/g, ')')
    return document.getElementById(id) ||
      document.getElementById(decodeURIComponent(id)) ||
      document.getElementById(encodeURIComponent(id)) ||
      document.getElementById(id.replace(/^h-/, '')) ||
      document.getElementById(decodeURIComponent(id.replace(/^h-/, ''))) ||
      document.getElementById(encodeURIComponent(id.replace(/^h-/, '')))
  }

  const { currentFile } = ctx.store.state
  if (!currentFile) {
    return
  }

  const { repo: fileRepo, path: filePath } = currentFile

  const link = e.target as HTMLAnchorElement

  // open attachment in os
  const href = link.getAttribute('href') || ''

  if (/^(http:|https:|ftp:)\/\//i.test(href)) { // external link
    window.open(link.href, '_blank')
  } else { // relative link
    if (/(\.md$|\.md#)/.test(href)) { // markdown file
      const tmp = decodeURI(href).split('#')

      let path = tmp[0]
      if (!path.startsWith('/')) { // to absolute path
        path = ctx.utils.path.join(ctx.utils.path.dirname(filePath || ''), path)
      }

      ctx.doc.switchDoc({
        path,
        name: ctx.utils.path.basename(path),
        repo: fileRepo,
        type: 'file'
      }).then(async () => {
        const hash = tmp.slice(1).join('#')
        // jump anchor
        if (hash) {
          await ctx.utils.sleep(50)
          const el = getElement(hash)

          if (el) {
            await ctx.utils.sleep(0)
            el.scrollIntoView()

            // reveal editor lint when click heading
            if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
              el.click()
            }
          }
        }
      })
    } else if (href && href.startsWith('#')) { // for anchor
      // do nothing
    } else {
      // open attachment in os
      const path = decodeURI(href)

      const basePath = path.startsWith('/')
        ? (ctx.base.getRepo(fileRepo)?.path || '/')
        : ctx.utils.path.dirname(currentFile.absolutePath || '/')

      ctx.base.openPath(ctx.utils.path.join(basePath, path))
    }
  }

  e.stopPropagation()
  e.preventDefault()
}
