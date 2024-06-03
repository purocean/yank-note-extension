import { ctx } from '@yank-note/runtime-api'
import type { editor } from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { createApp, type App, h, defineComponent } from 'vue'
import RenumberWidget from './RenumberWidget.vue'

let widget: App | null = null
let zone: (editor.IViewZone & { id: string }) | null = null

export function widgetIsVisible () {
  return !!zone
}

export function createWidget () {
  if (zone) {
    disposeWidget()
  }

  const editor = ctx.editor.getEditor()
  const selection = editor.getSelection()

  if (!selection) {
    return
  }

  editor.setScrollLeft(0)

  editor.changeViewZones(accessor => {
    const domNode = document.createElement('div')

    const opts: editor.IViewZone = {
      afterLineNumber: selection.startLineNumber - 1,
      heightInPx: 0,
      domNode,
    }

    const id = accessor.addZone(opts)
    ;(opts as any).id = id
    zone = opts as any

    setTimeout(() => {
      domNode.parentElement!.style.zIndex = '3'
      widget = createApp(defineComponent({
        setup () {
          return () => h(RenumberWidget, {
            onLayout: (height : number) => {
              if (zone) {
                zone.heightInPx = height
                editor.changeViewZones(accessor => {
                  accessor.layoutZone(zone!.id)
                })
              }
            },
            onDispose: () => disposeWidget()
          })
        }
      }))
      widget.mount(domNode)
    }, 0)
  })
}

export function disposeWidget () {
  const editor = ctx.editor.getEditor()
  if (zone) {
    editor.changeViewZones(accessor => {
      accessor.removeZone(zone!.id)
      zone = null
    })
  }

  widget?.unmount()
  widget = null

  editor.focus()
}
