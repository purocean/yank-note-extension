import { registerPlugin } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

registerPlugin({
  name: extensionId,
  register (ctx) {
    const storageStateKey = __EXTENSION_ID__ + '.state'
    const toggleActionName = __EXTENSION_ID__ + '.toggle'
    const showAllMarksActionName = __EXTENSION_ID__ + '.show-all-marks'
    const hideAllMarksActionName = __EXTENSION_ID__ + '.hide-all-marks'
    const visibleMarksClass = 'visible'
    const state = ctx.lib.vue.reactive(ctx.storage.get(storageStateKey, { enable: true }))

    const i18n = ctx.i18n.createI18n({
      en: {
        'space-mark': 'Space Marked Content',
        'show-all-marks': 'Show All Marks',
        'hide-all-marks': 'Hide All Marks',
        'space-mark-description': 'Space marked content for quizzes and learning.',
      },
      'zh-CN': {
        'space-mark': '挖空标记的内容',
        'show-all-marks': '显示所有挖空标记',
        'hide-all-marks': '隐藏所有挖空标记',
        'space-mark-description': '挖空标记的内容，用于测验和学习。',
      },
    })

    const cssContent = `
      html .markdown-view .markdown-body mark {
        background: transparent !important;
        border-bottom: 2px solid var(--g-color-accent);
        color: transparent;
        cursor: pointer;
      }

      html .markdown-view .markdown-body mark.${visibleMarksClass} {
        color: unset;
      }
    `

    let style: HTMLStyleElement | null = null
    async function init () {
      if (style && !state.enable) {
        style.remove()
        style = null
      } else if (!style && state.enable) {
        style = await ctx.view.addStyles(cssContent, false)
      }
    }

    ctx.lib.vue.watchEffect(() => {
      ctx.storage.set(storageStateKey, { enable: state.enable })
      init()
    })

    ctx.action.registerAction({
      name: toggleActionName,
      description: i18n.t('space-mark-description'),
      forUser: true,
      handler: () => {
        state.enable = !state.enable
      }
    })

    ctx.action.registerAction({
      name: showAllMarksActionName,
      description: i18n.t('show-all-marks'),
      forUser: true,
      when: () => state.enable,
      handler: async () => {
        (ctx.view.getViewDom())?.querySelectorAll('.markdown-body mark').forEach(mark => {
          mark.classList.add(visibleMarksClass)
        })
      },
    })

    ctx.action.registerAction({
      name: hideAllMarksActionName,
      description: i18n.t('hide-all-marks'),
      forUser: true,
      when: () => state.enable,
      handler: () => {
        (ctx.view.getViewDom())?.querySelectorAll('.markdown-body mark').forEach(mark => {
          mark.classList.remove(visibleMarksClass)
        })
      },
    })

    ctx.statusBar.tapMenus((menus) => {
      menus['status-bar-tool']?.list?.push(
        {
          id: __EXTENSION_ID__,
          type: 'normal',
          title: i18n.t('space-mark'),
          checked: state.enable,
          onClick: ctx.action.getActionHandler(toggleActionName),
        },
      )
    })

    ctx.registerHook('VIEW_ELEMENT_CLICK', ({ e }) => {
      if (!state.enable) {
        return
      }

      const target = e.target as HTMLElement
      if (target.tagName === 'MARK') {
        target.classList.toggle(visibleMarksClass)
        e.stopPropagation()
      }
    })

    ctx.view.tapContextMenus((menus, e) => {
      if (!state.enable) {
        return
      }

      const target = e.target as HTMLElement
      if (target.tagName === 'MARK') {
        const viewDom = ctx.view.getViewDom()
        const visibleMarks = viewDom?.querySelectorAll('.markdown-body mark.' + visibleMarksClass)?.length || 0
        const totalMarks = viewDom?.querySelectorAll('.markdown-body mark')?.length || 0

        console.error('xxx', visibleMarks, totalMarks)

        if (visibleMarks < totalMarks) {
          menus.push({
            id: showAllMarksActionName,
            label: i18n.t('show-all-marks'),
            onClick: ctx.action.getActionHandler(showAllMarksActionName),
          })
        }

        if (visibleMarks > 0) {
          menus.push({
            id: hideAllMarksActionName,
            label: i18n.t('hide-all-marks'),
            onClick: ctx.action.getActionHandler(hideAllMarksActionName),
          })
        }
      }
    })
  }
})
