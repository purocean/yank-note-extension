import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/share/types'
import i18n from './i18n'

export function getEditorPath (path?: string) {
  return ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), 'editor', path || '')
}

export function buildEditorUrl (file: Doc) {
  const search = new URLSearchParams({ name: file.name, path: file.path, repo: file.repo })
  return getEditorPath('index.html') + '?' + search.toString()
}

export async function createDrawioFile (node: Doc) {
  const currentPath = node.path
  const fileExt = ctx.lib.vue.ref<'.drawio' | '.drawio.png'>('.drawio')

  const { h } = ctx.lib.vue

  let filename = await ctx.ui.useModal().input({
    title: i18n.t('create-drawio-file'),
    hint: ctx.i18n.t('document.create-dialog.hint'),
    component: h('div', [
      ctx.i18n.t('document.current-path', currentPath),
      h('div', { style: 'margin: 8px 0' }, [
        i18n.t('file-type'),
        h('label', { style: 'margin-right: 8px' }, [h('input', { type: 'radio', name: 'type', value: '.drawio', checked: fileExt.value === '.drawio', onChange: () => { fileExt.value = '.drawio' } }), '.drawio']),
        h('label', { style: 'margin: 0 8px' }, [h('input', { type: 'radio', name: 'type', value: '.drawio.png', checked: fileExt.value === '.drawio.png', onChange: () => { fileExt.value = '.drawio.png' } }), '.drawio.png']),
      ]),
    ]),
    value: 'new-diagram',
    select: true
  })

  if (!filename) {
    return
  }

  if (!filename.endsWith(fileExt.value)) {
    filename = filename.replace(/\/$/, '') + fileExt.value
  }

  const path = ctx.utils.path.join(currentPath, filename)

  if (!path) {
    throw new Error('Need Path')
  }

  const file: Doc = { repo: node.repo, path: path, type: 'file', name: '', contentHash: 'new' }
  let isBase64: boolean
  let content: string

  if (fileExt.value === '.drawio.png') {
    isBase64 = true
    content = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHkAAAA9CAYAAACJM8YzAAAAAXNSR0IArs4c6QAAA0B0RVh0bXhmaWxlACUzQ214ZmlsZSUyMGhvc3QlM0QlMjJlbWJlZC5kaWFncmFtcy5uZXQlMjIlMjBtb2RpZmllZCUzRCUyMjIwMjItMDEtMTFUMDglM0EyNCUzQTEyLjA2NFolMjIlMjBhZ2VudCUzRCUyMjUuMCUyMChNYWNpbnRvc2glM0IlMjBJbnRlbCUyME1hYyUyME9TJTIwWCUyMDEwXzE1XzcpJTIwQXBwbGVXZWJLaXQlMkY1MzcuMzYlMjAoS0hUTUwlMkMlMjBsaWtlJTIwR2Vja28pJTIwQ2hyb21lJTJGOTcuMC40NjkyLjcxJTIwU2FmYXJpJTJGNTM3LjM2JTIyJTIwZXRhZyUzRCUyMlZielhWTkZVWXg4d1B1S1M2dGdRJTIyJTIwdmVyc2lvbiUzRCUyMjE2LjIuNCUyMiUyMHR5cGUlM0QlMjJlbWJlZCUyMiUzRSUzQ2RpYWdyYW0lMjBpZCUzRCUyMmluTVBjall2bm12bXh6aERLTFBOJTIyJTIwbmFtZSUzRCUyMlBhZ2UtMSUyMiUzRWpaSk5iNFFnRUlaJTJGRFhlVjFOMWVhJTJCM3VZWnNlUFBSTVpDb2tJSWJGVmZ2cmkyWHdJNlpKTDJibW1SbDU1d1ZDQ3oxZUxPdkV1JTJCR2dTSmJ3a2RCWGttVTVQZnZ2REtZQXpna05vTEdTQjVTdW9KTGZnREJCMmtzTzkxMmpNMFk1MmUxaGJkb1dhcmRqekZvejdOdSUyQmpOcWYyckVHRHFDcW1UclNUOG1kd0MyeTA4cXZJQnNSVDA3ejUxRFJMRGJqSm5mQnVCazJpSmFFRnRZWUZ5STlGcUJtNzZJdlllN3RqJTJCb2l6RUxyJTJGak9RaFlFSFV6M3VkaTF2dHc4VTU2YTRzVFY5eTJFZVNnaDlHWVIwVUhXc25xdUR2MkxQaE5QS1o2a1BqeUpRMXdPc2czR0RVTlFGakFabko5JTJCQzFjVWdmQ0hwRSUyQmJENm5jYWU4VEc2eHdad3l0dWxsJTJCdkx2Z0FqWWpwYXZodmJmTnFhZmtEJTNDJTJGZGlhZ3JhbSUzRSUzQyUyRm14ZmlsZSUzRTVX5JYAAAOnSURBVHhe7do9KLVhGAfw/4kkIhkoRfmaFEWUJIswyGxQFrEYLCgiBhHKUQZlowxSFgYZGJAM7IqEwccgH4uPeLvuXqfzvIec+015rnP/7zKd6xzX/f+d67mfp04AwDu4YjqBgCC/v9M5VpUDgQCIHKu6f/dF5BgHlu0RmcgOJODAFjnJRHYgAQe2yEkmsgMJOLBFTjKRHUjAgS1ykonsQAIObJGTTGQHEnBgi5xkIjuQgANb5CQT2YEEHNgiJ5nIDiTgwBY5yUR2IAEHtshJjhL57e0Np6enSExMRFZWVpTv8keZGuT8/Hz09vaivb09lNzBwQHKyspwc3OD5ORkJCUlfZrq0tISSktLUVBQgJOTE+Tm5nrqFhYW0NfXh/Pz84j3y+/Rx8bGMDo6ioeHB/N6SkoKJiYm0NHR4Q/Fb7pQhdzT0+MJ9gP5+vraIMvfysoKSkpKPNvOyMjA5eWlQT4+PkZeXp7n9fn5eXR3d+Pq6ioiroGBAUxPT2NxcRH19fWQiV5eXkZLSwumpqbQ1dXle+iYQ97f30d5eXlE8IJri3x7e4v09HTMzc2hra3N85mDg4MIBoO4u7szv2v281KFXFRUhKqqqlCeFxcXmJmZQfgkDw8Po7CwMFQjG2xubjYTbIu8t7eHyspKnJ2dITs72+O4vb2N6upqM/1ypfDzUoUcHx8POZs/lkyaQIQjy6U4LS0tVBMXFweZ7v9BXltbQ2NjI+7v7805HL52d3fNF+6zM95v4KqQozmTf/JyfXh4aG7YNjY2UFtb67EbHx83N4JPT09ISEjwm6unHyID+OrG6/Hx0Uyw3JQJaviqq6vDy8sLNjc3fQ0szcUcsjwOFRcXe4KX51q5QZIzeXV11XO+ZmZmYn19HZ2dnZBzNnzJ0TA5OYmhoSHI5zY1NeH19RWzs7Po7+/H1tYWampqiPxTCUjgX12uv3tOlpuzhoYGg/zvkudf+RK0trZGvLazs4OKigqMjIwY6I8lN1qCLtOsYamZ5N8O8/n5GUdHR0hNTUVOTs5vt2P1/4lsFZfOYiLrdLPqmshWceksJrJON6uuiWwVl85iIut0s+qayFZx6Swmsk43q66JbBWXzmIi63Sz6prIVnHpLCayTjerrolsFZfOYiLrdLPqmshWceksJrJON6uuiWwVl85iIut0s+qayFZx6Swmsk43q66JbBWXzmIi63Sz6prIVnHpLCayTjerrolsFZfO4hCyzvbZdbQJ/AFkdDUfctJpxQAAAABJRU5ErkJggg=='
  } else {
    isBase64 = false
    content = '<mxfile host="embed.diagrams.net" modified="2022-01-11T08:20:21.828Z" agent="5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36" etag="EEjUkbc3rjhjUWmDhpO0" version="16.2.4" type="embed"><diagram id="inMPcjYvnmvmxzhDKLPN" name="Page-1">jZJNb4QgEIZ/DXeV1N1ea+3uYZsePPRMZCokIIbFVfvri2XwI6ZJL2bmmRl55wVCCz1eLOvEu+GgSJbwkdBXkmU5PfvvDKYAzgkNoLGSB5SuoJLfgDBB2ksO912jM0Y52e1hbdoWardjzFoz7Nu+jNqf2rEGDqCqmTrST8mdwC2y08qvIBsRT07z51DRLDbjJnfBuBk2iJaEFtYYFyI9FqBm76IvYe7tj+oizELr/jOQhYEHUz3udi1vtw8U56a4sTV9y2EeSgh9GYR0UHWsnquDv2LPhNPKZ6kPjyJQ1wOsg3GDUNQFjAZnJ9+C1cUgfCHpE+bD6ncae8TG6xwZwytull+vLvgAjYjpavhvbfNqafkD</diagram></mxfile>'
  }

  try {
    await ctx.api.writeFile(file, content, isBase64)
    ctx.tree.refreshTree()
    ctx.doc.switchDoc(file)
    ctx.editor.switchEditor('drawio')
  } catch (error: any) {
    ctx.ui.useToast().show('warning', error.message)
    console.error(error)
  }
}
