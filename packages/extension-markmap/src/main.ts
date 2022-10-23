import { registerPlugin } from '@yank-note/runtime-api'
import MarkmapPreviewer from './MarkmapPreviewer.vue'
import MarkmapPreview from './MarkmapPreview.vue'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    ctx.view.registerPreviewer({
      name: 'Markmap',
      component: MarkmapPreviewer,
    })

    ctx.markdown.registerPlugin(md => {
      const temp = md.renderer.rules.fence!.bind(md.renderer.rules)
      md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
        const token = tokens[idx]

        if (token.info === 'markmap') {
          const source = token.content.trim()
          return ctx.lib.vue.h(MarkmapPreview, { source, fence: true })
        }

        return temp(tokens, idx, options, env, slf)
      }

      md.renderer.rules.bullet_list_open = (tokens, idx, options, { bMarks, source }, slf) => {
        const token = tokens[idx]
        const nextToken = tokens[idx + 1]
        if (token.map && nextToken && nextToken.attrGet('class')?.includes('markmap')) {
          const content = source
            .substring(bMarks[token.map[0]], bMarks[token.map[1]])
            .replace(/\{.markmap[^}]*\}/gm, '')
            .trim()

          return ctx.lib.vue.h(MarkmapPreview, { source: content, fence: true }) as any
        }

        return slf.renderToken(tokens, idx, options)
      }
    })

    if (ctx.editor.tapMarkdownMonarchLanguage) {
      ctx.editor.tapMarkdownMonarchLanguage(mdLanguage => {
        mdLanguage.tokenizer.root.unshift(
          [
            /^\s*```\s*markmap.*$/,
            { token: 'string', next: '@codeblockgh', nextEmbedded: 'js' }
          ],
        )
      })
    }
  }
})
