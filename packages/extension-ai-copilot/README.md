# AI Copilot

AI Copilot is a Yank Note extension that provides AI-powered text completion suggestions or rewrite suggestions.

## Screenshots

![Img](https://github.com/purocean/yn/assets/7115690/3088723d-e1f3-4bf7-8db2-5b54a23d8f11)
![Img](https://github.com/purocean/yn/assets/7115690/30731420-7f7b-4ad9-a523-cd489baa3fc5)

## Custom AI Adapter

AI Copilot is designed to be extensible. You can use your own AI adapter to provide code completion suggestions or rewrite suggestions.

First, you need learn how to write an Yank Note Plugin, Please refer to [Yank Note Plugin](https://github.com/purocean/yn/blob/develop/help/PLUGIN.md)

Then, you can write your own AI adapter plugin.

Example:

```js
window.registerPlugin({
  name: 'custom-ai-copilot-adapter',
  register: ctx => {
    ctx.registerHook('EXTENSION_READY', ({ extensions }) => {
      const extension = extensions.find(e => e.id === '@yank-note/extension-ai-copilot')
      if (!extension) {
        throw new Error('Can not find extension @yank-note/extension-ai-copilot')
      }

      const { registerAdapter, proxyFetch } = ctx.getPluginApi('@yank-note/extension-ai-copilot')

      class DemoCompletionAdapter {
        type = 'completion'
        id = 'demo'
        displayname = 'DemoCompletionAdapter'
        description = 'Powered by <a target="_blank" href="http://yank-note.com">Yank Note</a>'
        state = ctx.lib.vue.reactive({ apiPoint: 'demo' })
        panel = {
          type: 'form',
          items: [
            { type: 'input', key: 'apiPoint', label: 'Api Point', defaultValue: 'demo', props: { placeholder: 'demo' }, hasError: v => !v },
          ],
        }

        activate () {
          return {
            state: this.state,
            dispose: () => 0
          }
        }

        async fetchCompletionResults (model, position, context, cancelToken) {
          if (context.triggerKind === 0) { // auto trigger
            return { items: [] }
          }

          const range = new (ctx.editor.getMonaco().Range)(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column,
          )

          // proxyFetch(url, { headers, body, method })
          const text = 'Hello World!' + Math.random()

          return {
            items: [
              { text: text, insertText: { snippet: text }, range, }
            ]
          }
        }
      }

      class DemoEditAdapter {
        type ='edit'
        id ='demo'
        displayname = 'DemoEditAdapter'
        description = 'Powered by <a target="_blank" href="http://yank-note.com">Yank Note</a>'
        state = ctx.lib.vue.reactive({
          apiPoint: 'demo',
          instruction: 'test',
        })

        panel = {
          type: 'form',
          items: [
            { type: 'input', key: 'apiPoint', label: 'Api Point', defaultValue: 'demo', props: { placeholder: 'demo' }, hasError: v => !v },
            { type: 'instruction', key: 'instruction', label: 'Instruction' },
            { type: 'context', key: 'context', label: 'Context' },
          ],
        }

        activate () {
          return {
            state: this.state,
            dispose: () => 0
          }
        }

        async fetchEditResults (selectedText, instruction) {
          if (!selectedText) {
            return instruction + Date.now().toString()
          }

          return instruction + [...selectedText].reverse().join('')
        }
      }

      registerAdapter(new DemoCompletionAdapter())
      registerAdapter(new DemoEditAdapter())
    }, true)
  }
})
```
