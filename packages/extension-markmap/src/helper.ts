import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

export function buildHTML () {
  const baseUrl = getExtensionBasePath(extensionId)

  return `
    <style>
      html, body {
        padding: 0;
        margin: 0;
      }

      .mm-toolbar {
        opacity: 0;
        transition: opacity .1s;
      }

      body:hover .mm-toolbar {
        opacity: 1;
      }
    </style>
    <link rel="stylesheet" href="${baseUrl}/dist/markmap-toolbar.css">
    <script src="${baseUrl}/dist/d3.min.js"></script>
    <script src="${baseUrl}/dist/markmap-view.js"></script>
    <script src="${baseUrl}/dist/markmap-lib.iife.js"></script>
    <script src="${baseUrl}/dist/markmap-toolbar.js"></script>

    <svg xmlns="http://www.w3.org/2000/svg" id="markmap" style="width: 100%; height: 100vh; display: block;"></svg>
    `
}

export const linkApi: { mdRuleConvertLink: (arg: any) => void, htmlHandleLink: (e: HTMLElement) => boolean } = ctx.getPluginApi('markdown-link')
export const wikiLinksApi: { mdRuleWikiLinks: (...args: any[]) => any } = ctx.getPluginApi('markdown-wiki-links')
