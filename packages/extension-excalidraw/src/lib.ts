import { getExtensionBasePath, ctx } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'

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

export const FILE_SVG = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124.03515624999994 82.5859375" width="124.03515624999994" height="82.5859375">
<!-- svg-source:excalidraw -->
<!-- payload-type:application/vnd.excalidraw+json --><!-- payload-version:2 --><!-- payload-start -->eyJ2ZXJzaW9uIjoiMSIsImVuY29kaW5nIjoiYnN0cmluZyIsImNvbXByZXNzZWQiOnRydWUsImVuY29kZWQiOiJ4nM1VXW/aMFx1MDAxNH3nV6D0dU1i57tv60Y1pKkvsDFpmiqT3Fx1MDAwNlx1MDAxN2NHjjNKK/777EDjXHUwMDA0OqnSNmlBQuR+cM+991x1MDAxY/t5NFx1MDAxZTtqV4FzNXbgMSeMXHUwMDE2kmydd8b+XHUwMDEzZE1cdTAwMDXXLty+16KReVx1MDAxYrlSqqqvPK+katUs3VxcbLyqkVwiXHUwMDA3wr1cdTAwMWTh60suXHUwMDE0XFzCo1x1MDAwMm7+wVNcdTAwMTLA21x1MDAxMMq9iuRrUkLtdc7L07LAYFx1MDAwM1xc1brQd/0+XHUwMDFlP7ffPaBcdTAwMTJyRXjJoE1oXVx1MDAxNitcbpJT663gLW5cdTAwMTRjP/IzXHUwMDFm21xiWn/U9Vx1MDAxNFx1MDAxNNp9T1hcctZjTE6hllx1MDAxNUq/qPTO3949qW9cdTAwMGZcdTAwMDFMXHUwMDFhW/aeMjZTO3aYXG7JV43sgaqVXHUwMDE0a1jQQq1M9Vx1MDAxM3uXV1x1MDAwYt2+zZKiKVdcdTAwMWPqepAj9OSo2lx1MDAxOZvvd9bDXHUwMDE0rsbW8qjfgtB3s1xmozSJOnubmcVuhLIoQDg6XHUwMDAx80EwIVxymFx1MDAwYlx1MDAwNOZj4Sz1xkqNiVx1MDAxN12MkoTXXHUwMDE1kXpLNm770qZcdTAwMWa6flx1MDAxMKEoxmFmnqBcdTAwMGJZXHUwMDAxLVdKx8TYjdIoXHUwMDBievhqaHeAXHUwMDEynOBcYoWp9Zji1bRo+fDDTl6SXHJMTVxub1x1MDAxOOtcdTAwMGaPXHUwMDE3x+G98MYyJzha9rY7XHUwMDEzPzllXFyfdVx1MDAwM+YpTduu5Vx1MDAxZU1ubsPF7eTrdPswvV7MXHUwMDE3u89PrNo5Xdz++MvCb6qCXHUwMDFjWIfiLMVcdTAwMTHGQVx1MDAxOMR23Yzy9WlvTORrS9RRr5EzhVxmcPbF4We/XHUwMDE1R+CjJMAxQm9cdTAwMTbH613/7+KIQ1ePIUn13JPAXHUwMDBmk4FEMIrcfyqPKHFcdTAwMTMtikjzPFxuMj/ulerkgc9kXHUwMDEx4lx1MDAxNKNMXHUwMDBi489VMXCc0f9vMtSiXHUwMDEyXFzN6JPZXHUwMDA19lx1MDAwN9ZcdTAwMWKyoWw32GVLXT3F+WQ2d1x1MDAwNtb3jJaGxE6u0YJcdTAwMWPwW1F9iXRcdTAwMDFcdTAwMWJaXHUwMDE0/dsh16X07Vx1MDAwM3L6lkNdSFpSTtj8VSS6b/j0sink9na1JDVcdTAwMTivsadcdTAwMDd5jo6ad0hVzZSeZ3csOT8pbK/PyXNx3z7m7GjFbVRcdTAwMDTtabZcdTAwMWbtf1x1MDAwMYr0+rwifQ==<!-- payload-end -->
<defs>
  <style class="style-fonts">
    @font-face {
      font-family: "Virgil";
      src: url("https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw-assets/Virgil.woff2");
    }
    @font-face {
      font-family: "Cascadia";
      src: url("https://unpkg.com/@excalidraw/excalidraw/dist/excalidraw-assets/Cascadia.woff2");
    }
  </style>

</defs>
<rect x="0" y="0" width="124.03515624999994" height="82.5859375" fill="#ffffff"></rect><g stroke-linecap="round" transform="translate(10 10) rotate(0 52.01757812499997 31.29296875)"><path d="M15.65 0 M15.65 0 C30 -0.27, 47.15 2.18, 88.39 0 M15.65 0 C43.11 0.39, 71.36 -0.27, 88.39 0 M88.39 0 C100.2 0.47, 102.74 5.2, 104.04 15.65 M88.39 0 C97.6 2.11, 103.51 3.37, 104.04 15.65 M104.04 15.65 C103.35 25.26, 103.8 37.16, 104.04 46.94 M104.04 15.65 C104.26 26.13, 103.47 38.59, 104.04 46.94 M104.04 46.94 C104.37 56.32, 99.06 62.67, 88.39 62.59 M104.04 46.94 C103.94 57.07, 100.75 64.03, 88.39 62.59 M88.39 62.59 C68.24 62.77, 45.3 60.54, 15.65 62.59 M88.39 62.59 C65.92 62.93, 44.71 61.33, 15.65 62.59 M15.65 62.59 C5.52 61.82, 1.54 59.33, 0 46.94 M15.65 62.59 C3.24 61.6, 2.29 59.36, 0 46.94 M0 46.94 C0.12 38.51, -0.73 29.84, 0 15.65 M0 46.94 C0.44 36.64, -0.87 24.3, 0 15.65 M0 15.65 C0.7 4.84, 5.93 0.75, 15.65 0 M0 15.65 C0.32 7.01, 3.28 -0.8, 15.65 0" stroke="#1e1e1e" stroke-width="1" fill="none"></path></g><g transform="translate(33.11759948730469 28.79296875) rotate(0 28.899978637695312 12.5)"><text x="28.899978637695312" y="0" font-family="Virgil, Segoe UI Emoji" font-size="20px" fill="#1e1e1e" text-anchor="middle" style="white-space: pre;" direction="ltr" dominant-baseline="text-before-edge">TEST</text></g></svg>`

export const FILE_PNG = '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XHUwMDE3XYyShNdcdTAwMTWReks2bvvSplx1MDAxZrp+XHUwMDEwoSjGYWaeoFx1MDAwYllcdTAwMDEtV0rHxNiN0ihcdTAwMGJ6+Gpod4BcdTAwMTKc4Fxihan1mOLVtGj58MNOXpJcckxNXG5vXHUwMDE461x1MDAwZo9cdTAwMTfH4b3wxjInOFr2tjtcdTAwMTM/OWVcXJ91XHUwMDAz5ilN267lXHUwMDFlTW5uw8Xt5Ot0+zC9XsxcdTAwMTe7z0+s2jld3P74y8JvqoJcdTAwMWNYh+IsxVx1MDAxMcZBXHUwMDE4xHbdjPL1aW9M5GtL1FGvkTOFXGZw9sXhZ79cdTAwMTVH4KMkwDFCb1x1MDAxNsfrXf/v4ohDV48hSfXck8BcdTAwMGaTgUQwitx/Ko8ocVx1MDAxMy2KSPM8XG4yP+6V6uSBz2RcdTAwMTHiXHUwMDE0o0xcdTAwMGLjz1UxcJzR/28y1KJcdTAwMTJcXM3ok9lcdTAwMDX2XHUwMDA31lx1MDAxYrKhbDfYZUtdPcX5ZDZ3XHUwMDA21veMlobETq7Rglx1MDAxY/BbUX2JdFx1MDAwMVx1MDAxYlpcdTAwMTT92yHXpfTtXHUwMDAzcvqWQ11IWlJO2PxVJLpv+PSyKeT2drUkNVx1MDAxOK+xp1x1MDAwN3mOjpp3SFXNlJ5ndyzpXHUwMDA10uI4XHUwMDE0O0PnJ4Xt9TmlLu7bx5woreSNtqA94/aj/S9NeFx1MDAwMVx1MDAxYiJ9VHGdaQAAAABJRU5ErkJggg=='

export const SETTING_KEY_FONT_HANDWRITING = 'plugin.excalidraw.font.handwriting'

export function getEditorPath (path?: string) {
  return ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), 'editor', path || '')
}

export function buildEditorUrl (file: Doc) {
  const search = new URLSearchParams({ name: file.name, path: file.path, repo: file.repo })
  return getEditorPath('index.html') + '?' + search.toString()
}
