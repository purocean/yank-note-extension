import { getExtensionBasePath } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

export function buildHTML () {
  const baseUrl = getExtensionBasePath(extensionId)

  return `
    <style>
      html, body {
        padding: 0;
        margin: 0;
      }
    </style>
    <link rel="stylesheet" href="${baseUrl}/dist/markmap-toolbar.css">
    <script src="${baseUrl}/dist/d3.min.js"></script>
    <script src="${baseUrl}/dist/markmap-view.min.js"></script>
    <script src="${baseUrl}/dist/markmap-lib.min.js"></script>
    <script src="${baseUrl}/dist/markmap-toolbar.umd.min.js"></script>

    <svg xmlns="http://www.w3.org/2000/svg" id="markmap" style="width: 100%; height: 100vh; display: block;"></svg>
    `
}
