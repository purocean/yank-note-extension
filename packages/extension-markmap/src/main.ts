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
          return ctx.lib.vue.h(MarkmapPreview, { source, file: env?.file, fence: true })
        }

        return temp(tokens, idx, options, env, slf)
      }

      const bulletListRule = md.renderer.rules.bullet_list_open
      md.renderer.rules.bullet_list_open = (tokens, idx, options, env, slf) => {
        const token = tokens[idx]
        const nextToken = tokens[idx + 1]
        if (token.map && nextToken && nextToken.attrGet('class')?.includes('markmap')) {
          const content = env.source
            .substring(env.bMarks[token.map[0]], env.bMarks[token.map[1]])
            .replace(/\{.markmap[^}]*\}/gm, '')
            .trim()

          return ctx.lib.vue.h(MarkmapPreview, { source: content, file: env?.file, fence: true }) as any
        }

        if (bulletListRule) {
          return bulletListRule.call(slf, tokens, idx, options, env, slf)
        } else {
          return slf.renderToken(tokens, idx, options)
        }
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

    ctx.editor.tapSimpleCompletionItems(items => {
      /* eslint-disable no-template-curly-in-string */

      items.push(
        { label: '/ + Markmap', insertText: '+ ${1:Subject}{.markmap}\n    + ${2:Topic}\n', block: true },
        { label: '/ ``` Markmap', insertText: '```markmap\n+ ${1:Subject}\n    + ${2:Topic}\n```\n', block: true },
      )
    })
  }
})
