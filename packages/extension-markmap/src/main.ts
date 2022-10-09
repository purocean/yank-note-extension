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
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (ctx.editor.tapMarkdownMonarchLanguage) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
