import { getExtensionBasePath, ctx } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'

const supportedFileTypes = ['.excalidraw', '.excalidraw.json', '.excalidraw.svg', '.excalidraw.png']

export const CUSTOM_EDITOR_IFRAME_ID = 'custom-excalidraw-editor-iframe'
export const LIBRARY_RETURN_URL = 'yank-note://extension/excalidraw/add-library'
export const LIBRARY_FILE = '@yank-note$extension-excalidraw/libraries.excalidrawlib'

export const FILE_JSON = `{
  "type": "excalidraw",
  "version": 2,
  "source": "https://github.com/purocean/yank-note-extension/tree/main/packages/extension-excalidraw",
  "elements": [
    {
      "type": "rectangle",
      "version": 137,
      "versionNonce": 1620509027,
      "isDeleted": false,
      "id": "dtbp18Ut8_0w_ztXj3eEu",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "x": 340.9921875,
      "y": 196.51953125,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "width": 104.03515624999993,
      "height": 62.5859375,
      "seed": 1727251485,
      "groupIds": [],
      "frameId": null,
      "roundness": {
        "type": 3
      },
      "boundElements": [
        {
          "type": "text",
          "id": "FN4WNEVIwjIBWTWyLzlpy"
        }
      ],
      "updated": 1698252234361,
      "link": null,
      "locked": false
    },
    {
      "type": "text",
      "version": 109,
      "versionNonce": 1301732611,
      "isDeleted": false,
      "id": "FN4WNEVIwjIBWTWyLzlpy",
      "fillStyle": "hachure",
      "strokeWidth": 1,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "angle": 0,
      "x": 364.1097869873047,
      "y": 215.3125,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "transparent",
      "width": 57.799957275390625,
      "height": 25,
      "seed": 428219251,
      "groupIds": [],
      "frameId": null,
      "roundness": null,
      "boundElements": [],
      "updated": 1698252234361,
      "link": null,
      "locked": false,
      "fontSize": 20,
      "fontFamily": 1,
      "text": "TEST",
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": "dtbp18Ut8_0w_ztXj3eEu",
      "originalText": "TEST",
      "lineHeight": 1.25,
      "baseline": 18
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}`

export const FILE_SVG = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124.03515625 82.5859375" width="124.03515625" height="82.5859375">
<!-- svg-source:excalidraw -->
<!-- payload-type:application/vnd.excalidraw+json --><!-- payload-version:2 --><!-- payload-start -->eyJ2ZXJzaW9uIjoiMSIsImVuY29kaW5nIjoiYnN0cmluZyIsImNvbXByZXNzZWQiOnRydWUsImVuY29kZWQiOiJ4nO1VXW+bMFx1MDAxNH3Pr4jo60T9gTH0bd1SLdLUl2TLpGmqXFxwXHUwMDEzN1x1MDAwZSDjNKVV/nttk2BIo2nb84hcdTAwMTTB/eLce88xr6PxONBNxYOrccCfMyZFrtgu+GDtT1xc1aIsjFx1MDAwYrnnutyqzEWutK7qq8tLn1x1MDAxMWblps3ikm94oWtcdTAwMTP30zyPx6/u33hEbnNzfV/B5JtO7sDu7kX/eMR8snWpLuhcYkbxTLNiKbl3PVx1MDAxYjtcdTAwMDQpXGJTQlx1MDAwMYaIdJ7GYlx1MDAwNDhcdTAwMDQ0QjCh3rFcdTAwMTO5Xrm0KFx1MDAwNJhAXHUwMDEyoyi1XHUwMDE37kJWXFwsV9rExCgkXHRJcS+9XHUwMDA1cDVcdTAwMDadpdaqXFzzT6UslUV5XHUwMDAxuf15jPcsWy9VuS3yLkYrVtRcdTAwMTVTZig+7kFIOdONbMfJstVW9aq0b1lcdTAwMWPBn9i7vLo0w/dZ5rXLVcHrepBTVixcdTAwMTO6cUPwfViM1TR3W/rlUSm24VO7pmIrZb9wkVx1MDAxZlxuXHUwMDFmt+lXhVx1MDAwZpa9h8m5rVx1MDAwMSmiiMAo8Vx1MDAwM/WUwvjUeFtcdTAwMTaOXWZXXHUwMDEwXHUwMDEzXGaQ70HUn1xyrbSr+sBkzf28LbTJKeX6tFx1MDAxYrBK82e/hFx1MDAxZSlvbqPF7eT7dPc4vV7MXHUwMDE3zddcdTAwMTdZNUFcdTAwMTe3P9z5SW2rnLV4YJzSXHUwMDA04lxioziNO79cdTAwMTTF+nSMsszWvoVRb2YnXHUwMDEyOY/mnURcdTAwMDbNtOqAMLJcIogxoJhiXHUwMDEw0aFEXHUwMDEwXGaTmJ5VXGKhITW6IGZnXHUwMDA0pyDuqatTXGL6r4zfKGPgOEggQlx0gqlcdTAwMTHBXHUwMDE5XHUwMDA1vFPFUVx1MDAwMFx1MDAwNCNMI1xm/oX/XHUwMDAzXHUwMDEwZ0hcdTAwMWFcdTAwMTGU/Fx1MDAwNUk95yzXzGDnk9m8t6uy0DPxwt3xO7DesI2QzWDctsRHKZa29yAzeLlcbvoj0MJ8TLqAjchzOaBPzVxyXndA+Fx1MDAwZTLzKmasavon35ZSiaUomJyfbcZW/3KkOlxmXHUwMDExaVx1MDAxNTo6yD5gVTXTZp7dIVx1MDAxODxcdL67fk/ri1x1MDAwN3fZ48Pp21Kau7NzP9q/XHUwMDAx4y7i4CJ9<!-- payload-end -->
<defs>
  <style class="style-fonts">
    @font-face {
      font-family: "Virgil";
      src: url("https://excalidraw.com/Virgil.woff2");
    }
    @font-face {
      font-family: "Cascadia";
      src: url("https://excalidraw.com/Cascadia.woff2");
    }
  </style>
</defs>
<rect x="0" y="0" width="124.03515625" height="82.5859375" fill="#ffffff"></rect><g stroke-linecap="round" transform="translate(10 10) rotate(0 52.017578125 31.29296875)"><path d="M15.65 0 M15.65 0 C30 -0.27, 47.15 2.18, 88.39 0 M15.65 0 C43.11 0.39, 71.36 -0.27, 88.39 0 M88.39 0 C100.2 0.47, 102.74 5.2, 104.04 15.65 M88.39 0 C97.6 2.11, 103.51 3.37, 104.04 15.65 M104.04 15.65 C103.35 25.26, 103.8 37.16, 104.04 46.94 M104.04 15.65 C104.26 26.13, 103.47 38.59, 104.04 46.94 M104.04 46.94 C104.37 56.32, 99.06 62.67, 88.39 62.59 M104.04 46.94 C103.94 57.07, 100.75 64.03, 88.39 62.59 M88.39 62.59 C68.24 62.77, 45.3 60.54, 15.65 62.59 M88.39 62.59 C65.92 62.93, 44.71 61.33, 15.65 62.59 M15.65 62.59 C5.52 61.82, 1.54 59.33, 0 46.94 M15.65 62.59 C3.24 61.6, 2.29 59.36, 0 46.94 M0 46.94 C0.12 38.51, -0.73 29.84, 0 15.65 M0 46.94 C0.44 36.64, -0.87 24.3, 0 15.65 M0 15.65 C0.7 4.84, 5.93 0.75, 15.65 0 M0 15.65 C0.32 7.01, 3.28 -0.8, 15.65 0" stroke="#1e1e1e" stroke-width="1" fill="none"></path></g><g transform="translate(33.11759948730469 28.79296875) rotate(0 28.899978637695312 12.5)"><text x="28.899978637695312" y="0" font-family="Virgil, Segoe UI Emoji" font-size="20px" fill="#1e1e1e" text-anchor="middle" style="white-space: pre;" direction="ltr" dominant-baseline="text-before-edge">TEST</text></g></svg>`

export const FILE_PNG = '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SXEvvVx1MDAwNXA1XHUwMDA2naXWqlxc80+lLJVFeVx1MDAwMbn9eYz3LFsvVbkt8i5GK1bUXHUwMDE1U2YoPu5BSDnTjWzHybLVVvWqtG9ZXHUwMDFjwZ/Yu7y6NMP3Wea1y1XB63qQU1YsXHUwMDEzunFD8H1YjNU0d1v65VEptuFTu6ZiK2W/cJFcdTAwMWZcblx1MDAxZrfpV4VcdTAwMGaWvYfJua1cdTAwMDEpoojAKPFcdTAwMDP1lML41HhbXHUwMDE2jl1mV1x1MDAxMFx1MDAxM1xmkO9B1J9ccq20q/rAZM39vC20ySnl+rRcdTAwMWKwSvNnv4RcdTAwMWUpb26jxe3k+3T3OL1ezFx1MDAxN83XXHUwMDE3WTVBXHUwMDE3tz/c+Ultq5y1eGCc0lx1MDAwNOJcYqM4jTu/XHUwMDE0xfp0jLLM1r6FUW9mJ1x1MDAxMjmP5p1EXHUwMDA2zbTqgDCyXCKIMaCYYlx1MDAxMNGhRFx1MDAxMFxmk5ieVVxioSE1uiBmZ1x1MDAwNKcg7qmrU1xi+q+M3yhj4DhIIEJcdIKpXHUwMDExwVx1MDAxOVx1MDAwNbxTxVFcdTAwMDBcdTAwMDQjTCNcZv6F/1x1MDAwM1x1MDAxMGdIXHUwMDFhXHUwMDExlPxcdTAwMDVJPecs18xg55PZvLerstAz8cLd8Tuw3rCNkM1g3LbERymWtvcgM3i5XG76I9DCfEy6gI3IczmgT81ccl53QPhcdTAwMGUy8ypmrGr6J9+WUomlKJicn23GVv9ypDpcZlx1MDAxMWlcdTAwMTU6Osg+YFU102ae3SFoqFwi8kP7fobBk+C76/dkv3hwlz1UnOot0bk7Ufej/Vx1MDAxYpis6TAifbmG7WYAAAAASUVORK5CYII='

export function supported (doc?: Doc | null) {
  return !!(doc && supportedFileTypes.some(type => doc.path.endsWith(type)))
}

export function getEditorPath (path?: string) {
  return ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), 'editor', path || '')
}

export function buildEditorUrl (file: Doc) {
  const search = new URLSearchParams({ name: file.name, path: file.path, repo: file.repo })
  return getEditorPath('index.html') + '?' + search.toString()
}
