import type Markdown from '@yank-note/runtime-api/types/types/third-party/markdown-it'
import { ctx } from '@yank-note/runtime-api'

const { debounce } = ctx.lib.lodash
const { defineComponent, h, onMounted, ref, watch } = ctx.lib.vue
const { getLogger } = ctx.utils

export const settingKeyKrokiUrl = 'plugin.kroki.img-url'
export const defaultKrokiImgUrl = 'https://kroki.io/{type}/svg/{payload}'

const extensionId = __EXTENSION_ID__

const loadingImg = 'data:image/gif;base64,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'

const logger = getLogger(extensionId)

function encode (str: string) {
  const data = new TextEncoder().encode(str)
  const compressed = ctx.lib.pako.deflate(data, { level: 9 })
  return btoa(String.fromCharCode.apply(null, compressed)).replace(/\+/g, '-').replace(/\//g, '_')
}

const Mermaid = defineComponent({
  name: 'extension-kroki',
  props: {
    attrs: Object,
    type: String,
    code: {
      type: String,
      default: ''
    }
  },
  setup (props) {
    const img = ref(loadingImg)
    const imgUrl = ctx.setting.getSetting(settingKeyKrokiUrl, defaultKrokiImgUrl)

    async function render () {
      logger.debug('render', props.code)
      await ctx.utils.sleep(0)
      const payload = encode(props.code)
      img.value = imgUrl.replace('{type}', props.type!).replace('{payload}', payload)
    }

    const renderDebounce = debounce(render, 1000, { leading: false, trailing: true })

    watch([() => props.code, () => props.type], renderDebounce)

    onMounted(render)

    return () => {
      if (!ctx.getPremium()) {
        return h('p', { ...props.attrs }, [
          h('em', [
            h('a', { href: 'javascript:ctx.showPremium();' }, 'Kroki is a premium feature, please upgrade to use it.')
          ]),
        ])
      }

      return h('p', { ...props.attrs }, [
        h('img', { src: img.value, alt: 'kroki', [ctx.args.DOM_ATTR_NAME.ONLY_CHILD]: true }),
      ])
    }
  }
})

export const MarkdownItPlugin = (md: Markdown) => {
  const temp = md.renderer.rules.fence!.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    const token = tokens[idx]
    const content = token.content.trim()
    const firstLine = content.split(/\n/)[0].trim()
    const matchs = firstLine.match(/--kroki--\s*(\w+)/)
    if (matchs) {
      const type = matchs[1]
      if (type) {
        // remove first line
        const code = content.substring(content.indexOf('\n') + 1)
        return h(Mermaid, { attrs: token.meta?.attrs, code, type }) as any
      }
    }

    return temp(tokens, idx, options, env, slf)
  }
}
