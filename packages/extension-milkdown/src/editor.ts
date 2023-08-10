import { defaultValueCtx, Editor, editorViewOptionsCtx, rootCtx, ThemeColor, ThemeImageType } from '@milkdown/core'
import remarkFrontmatter from 'remark-frontmatter'
import { refractor } from 'refractor/lib/common'
import { nordDark, nordLight } from '@milkdown/theme-nord'
import { AtomList, createNode, switchTheme, $shortcut, $remark } from '@milkdown/utils'
import { gfm } from '@milkdown/preset-gfm'
import { emoji } from '@milkdown/plugin-emoji'
import { tooltip } from '@milkdown/plugin-tooltip'
import { menu, menuPlugin } from '@milkdown/plugin-menu'
import { block } from '@milkdown/plugin-block'
import { indent, indentPlugin } from '@milkdown/plugin-indent'
import { trailing } from '@milkdown/plugin-trailing'
import { diagram } from '@milkdown/plugin-diagram'
import { prismPlugin } from '@milkdown/plugin-prism'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { history } from '@milkdown/plugin-history'
import { math } from '@milkdown/plugin-math'
import { slash } from '@milkdown/plugin-slash'
import { upload, uploadPlugin, Uploader } from '@milkdown/plugin-upload'

import { ctx } from '@yank-note/runtime-api'

import 'katex/dist/katex.min.css'
import 'prism-themes/themes/prism-nord.css'
import 'material-icons/iconfont/material-icons.css'
import '@fontsource/roboto'

const logger = ctx.utils.getLogger('milkdown')
const container = document.getElementById('editor')!
container.innerHTML = ''

const yaml = createNode(() => {
  return {
    id: 'yaml',
    schema: () => ({
      attrs: {
        value: { default: '' },
      },
      toDOM: (node) => ['yaml', { style: 'display: none', value: node.attrs.value }],
      group: 'block',
      parseMarkdown: {
        match: ({ type }) => type === 'yaml',
        runner: (state, node, type) => {
          state.addNode(type, { value: node.value as string })
        }
      },
      toMarkdown: {
        match: (node) => node.type.name === 'yaml',
        runner: (state, node) => {
          state.addNode('yaml', undefined, undefined, {
            value: node.attrs.value,
          })
        },
      },
    }),
  }
})

const renderImage: Parameters<typeof nordLight.override>[0] = (_emotion, themeManager) => {
  const image = themeManager.getSlice<ThemeImageType>('image')
  themeManager.set<ThemeImageType>('image', (payload) => {
    const img = image(payload)!
    const onUpdate = img.onUpdate
    img.onUpdate = (node) => {
      const { alt, title, loading, failed } = node.attrs
      // relative path
      const currentFile = ctx.store.state.currentFile
      if (currentFile && node.attrs.src && !(/^[^:]*:/.test(node.attrs.src) || node.attrs.src.startsWith('//'))) {
        const basePath = ctx.utils.path.dirname(currentFile.path)
        const src = ctx.base.getAttachmentURL({
          ...currentFile,
          name: ctx.utils.path.basename(node.attrs.src),
          path: ctx.utils.path.resolve(basePath, node.attrs.src),
        })
        ;(onUpdate as any)({ attrs: { src, alt, title, loading, failed } })
      } else {
        onUpdate(node)
      }
    }
    return img
  })
}

nordLight.override(renderImage)
nordDark.override((emotion, manager) => {
  const themeColor = manager.getSlice(ThemeColor)
  manager.set(ThemeColor, ([key, ...rest]) => {
    if (key === 'surface') {
      return 'var(--g-color-92)'
    }

    return themeColor([key, ...rest])
  })
  renderImage(emotion, manager)
})

const uploader: Uploader = async (files, schema) => {
  const images: any[] = []

  const currentFile = ctx.store.state.currentFile
  if (!currentFile) {
    return []
  }

  const checker = ctx.doc.createCurrentDocChecker()

  for (let i = 0; i < files.length; i++) {
    const file = files.item(i)
    if (!file) {
      continue
    }

    // You can handle whatever the file type you want, we handle image here.
    if (!file.type.includes('image')) {
      continue
    }

    checker.throwErrorIfChanged()
    const src = await ctx.base.upload(file, { repo: currentFile.repo, path: currentFile.path })
    const alt = file.name
    images.push(schema.nodes.image.createAndFill({ src, alt }))
  }

  return images
}

const editor = Editor.make()
  .use(ctx.theme.getColorScheme() === 'dark' ? nordDark : nordLight)
  .use(gfm)
  .use(emoji)
  .use(tooltip)
  .use(menu.configure(menuPlugin, {}))
  .use(block)
  .use(indent.configure(indentPlugin, {
    type: 'space', // available values: 'tab', 'space',
    size: ctx.setting.getSetting('editor.tab-size', 4),
  }))
  .use(trailing)
  .use(diagram)
  .use(listener)
  .use(history)
  .use($shortcut(() => {
    return {
      'Mod-s': () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ctx.editor.triggerSave()
        return true
      }
    }
  }))
  .use($remark(() => remarkFrontmatter))
  .use(AtomList.create([yaml()]))
  .use(prismPlugin({ configureRefractor: () => refractor }))
  .use(math)
  .use(slash)
  .use(upload.configure(uploadPlugin, {
    uploader,
    enableHtmlFileUploader: true,
  }))

async function createEditor (content: string) {
  logger.debug('create editor')
  await editor.destroy()
  await editor.config((_ctx) => {
    _ctx.set(defaultValueCtx, content)
    _ctx.set(rootCtx, container)
    _ctx.set(editorViewOptionsCtx, {
      editable: () => !ctx.args.FLAG_READONLY
    })
    _ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
      logger.debug('markdown updated', markdown)
      ctx.store.state.currentContent = markdown
    })
  }).create()
  window.scrollTo(0, 0)
}

function onThemeChange () {
  editor.action(switchTheme(ctx.theme.getColorScheme() === 'dark' ? nordDark : nordLight))
}

ctx.store.watch(() => ctx.store.state.currentFile, (file) => {
  if (file && ctx.doc.isMarkdownFile(file)) {
    createEditor(file.content || '')
  }
}, { immediate: true })

ctx.registerHook('THEME_CHANGE', onThemeChange)
