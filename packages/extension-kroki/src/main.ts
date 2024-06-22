import { registerPlugin } from '@yank-note/runtime-api'
import { MarkdownItPlugin, defaultKrokiImgUrl, settingKeyKrokiUrl } from './kroki'

const extensionId = __EXTENSION_ID__

const textFormatA = `\`\`\`\${2:js}
// --kroki-- \${1|wavedrom,blockdiag,bpmn,bytefield,seqdiag,actdiag,nwdiag,packetdiag,rackdiag,c4plantuml,d2,dbml,ditaa,erd,excalidraw,graphviz,mermaid,nomnoml,pikchr,plantuml,structurizr,svgbob,symbolator,tikz,vega,vegalite,wireviz|}
\${3:{ signal: [
  { name: "clk",         wave: "p.....|..." \\},
  { name: "Data",        wave: "x.345x|=.x", data: ["head", "body", "tail", "data"] \\},
  { name: "Request",     wave: "0.1..0|1.0" \\},
  {\\},
  { name: "Acknowledge", wave: "1.....|01." \\}
]\\}}
\`\`\``

const textFormatB = `\`\`\`kroki
\${1|wavedrom,blockdiag,bpmn,bytefield,seqdiag,actdiag,nwdiag,packetdiag,rackdiag,c4plantuml,d2,dbml,ditaa,erd,excalidraw,graphviz,mermaid,nomnoml,pikchr,plantuml,structurizr,svgbob,symbolator,tikz,vega,vegalite,wireviz|}
\${2:{ signal: [
  { name: "clk",         wave: "p.....|..." \\},
  { name: "Data",        wave: "x.345x|=.x", data: ["head", "body", "tail", "data"] \\},
  { name: "Request",     wave: "0.1..0|1.0" \\},
  {\\},
  { name: "Acknowledge", wave: "1.....|01." \\}
]\\}}
\`\`\``

registerPlugin({
  name: extensionId,
  register: ctx => {
    const i18n = ctx.i18n.createI18n({
      en: {
        'kroki.image-url': 'Kroki Image URL',
      },
      'zh-CN': {
        'kroki.image-url': 'Kroki 图片地址',
      }
    })

    ctx.markdown.registerPlugin(MarkdownItPlugin)

    ctx.editor.tapSimpleCompletionItems(items => {
      /* eslint-disable no-template-curly-in-string */
      items.push(
        { label: '/ ``` Kroki Format: ```[lang]', insertText: textFormatA, block: true },
        { label: '/ ``` kroki Format: ```kroki', insertText: textFormatB, block: true },
      )
    })

    ctx.setting.changeSchema(schema => {
      if (!schema.groups.some((x: any) => x.value === 'plugin')) {
        schema.groups.push({ value: 'plugin', label: 'Plugin' } as any)
      }

      schema.properties[settingKeyKrokiUrl] = {
        title: i18n.$$t('kroki.image-url'),
        type: 'string',
        defaultValue: defaultKrokiImgUrl,
        description: 'e.g. ' + defaultKrokiImgUrl,
        group: 'plugin',
        required: true,
      }
    })
  }
})
