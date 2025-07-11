import { registerPlugin } from '@yank-note/runtime-api'
import rangeParser from 'parse-numeric-range'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    async function init () {
      const style = await ctx.view.addStyles('')

      const classNameReg = /^h:([\d,.-]+)$/
      const dataLineNumbersReg = /^[\d,.-]+$/

      function update () {
        const dom = ctx.view.getViewDom()
        const codeBlocks = dom?.querySelectorAll('pre > code')

        const selectors = new Set<string>()

        codeBlocks?.forEach((codeBlock) => {
          // class h:1,2,3
          codeBlock.classList.forEach((className) => {
            const match = className.match(classNameReg)
            if (match) {
              const range = match[1]
              const lines = rangeParser(range)
              const styleClassName = className.replace(/([:.,])/g, '\\$1')
              lines.forEach((line) => {
                if (line > 0) {
                  selectors.add(`pre > code.${styleClassName} table.hljs-ln tr:nth-child(${line}) > *`)
                }
              })
            }
          })

          // data-line-numbers https://revealjs.com/code/#line-numbers-%26-highlights
          const lineNumbers = codeBlock.getAttribute('data-line-numbers')
          if (lineNumbers && dataLineNumbersReg.test(lineNumbers)) {
            const styleSelectorName = `[data-line-numbers="${lineNumbers.replace(/([:.,])/g, '\\$1')}"]`

            const lines = rangeParser(lineNumbers)
            lines.forEach((line) => {
              if (line > 0) {
                selectors.add(`pre > code${styleSelectorName} table.hljs-ln tr:nth-child(${line}) > *`)
              }
            })
          }
        })

        if (selectors.size > 0) {
          const color = '#faef4e52'

          const selectorString = Array.from(selectors).join(',\n')
          style.textContent = `
            ${selectorString} {
              background-color: ${color} !important;
            }
          `
        } else {
          style.textContent = ''
        }
      }

      ctx.registerHook('VIEW_RENDERED', update)
    }

    init()
  }
})
