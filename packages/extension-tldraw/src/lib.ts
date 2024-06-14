import { getExtensionBasePath, ctx } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'

export const FILE_JSON = '{"tldrawFileFormatVersion":1,"schema":{"schemaVersion":2,"sequences":{"com.tldraw.store":4,"com.tldraw.asset":1,"com.tldraw.camera":1,"com.tldraw.document":2,"com.tldraw.instance":25,"com.tldraw.instance_page_state":5,"com.tldraw.page":1,"com.tldraw.instance_presence":5,"com.tldraw.pointer":1,"com.tldraw.shape":4,"com.tldraw.asset.bookmark":2,"com.tldraw.asset.image":3,"com.tldraw.asset.video":3,"com.tldraw.shape.arrow":4,"com.tldraw.shape.bookmark":2,"com.tldraw.shape.draw":1,"com.tldraw.shape.embed":4,"com.tldraw.shape.frame":0,"com.tldraw.shape.geo":8,"com.tldraw.shape.group":0,"com.tldraw.shape.highlight":0,"com.tldraw.shape.image":3,"com.tldraw.shape.line":4,"com.tldraw.shape.note":6,"com.tldraw.shape.text":2,"com.tldraw.shape.video":2,"com.tldraw.binding.arrow":0}},"records":[{"gridSize":10,"name":"","meta":{},"id":"document:document","typeName":"document"},{"id":"pointer:pointer","typeName":"pointer","x":397.7837144109782,"y":683.3788024566456,"lastActivityTimestamp":1718357258411,"meta":{}},{"meta":{},"id":"page:page","name":"Page 1","index":"a1","typeName":"page"},{"followingUserId":null,"opacityForNextShape":1,"stylesForNextShape":{"tldraw:geo":"star"},"brush":null,"scribbles":[],"cursor":{"type":"default","rotation":0},"isFocusMode":false,"exportBackground":true,"isDebugMode":false,"isToolLocked":false,"screenBounds":{"x":0,"y":0,"w":1545,"h":409},"insets":[false,false,false,false],"zoomBrush":null,"isGridMode":false,"isPenMode":false,"chatMessage":"","isChatting":false,"highlightedUserIds":[],"isFocused":true,"devicePixelRatio":1,"isCoarsePointer":false,"isHoveringCanvas":false,"openMenus":[],"isChangingStyle":false,"isReadonly":false,"meta":{},"duplicateProps":null,"id":"instance:instance","currentPageId":"page:page","typeName":"instance"},{"editingShapeId":null,"croppingShapeId":null,"selectedShapeIds":[],"hoveredShapeId":null,"erasingShapeIds":[],"hintingShapeIds":[],"focusedGroupId":null,"meta":{},"id":"instance_page_state:page:page","pageId":"page:page","typeName":"instance_page_state"},{"x":333.0951918390218,"y":-60.937396206645644,"z":1,"meta":{},"id":"camera:page:page","typeName":"camera"},{"x":61.9296875,"y":199.921875,"rotation":0,"isLocked":false,"opacity":1,"meta":{},"id":"shape:KjJnvyPAdCIVxr7qetuKB","type":"geo","props":{"w":158,"h":124.62109375,"geo":"rectangle","color":"black","labelColor":"black","fill":"none","dash":"draw","size":"m","font":"draw","text":"Hello","align":"middle","verticalAlign":"middle","growY":0,"url":""},"parentId":"page:page","index":"a1","typeName":"shape"}]}'

export const FILE_SVG = ''

export const FILE_PNG = ''

export function getEditorPath (path?: string) {
  return ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), 'editor', path || '')
}

export function buildEditorUrl (file: Doc) {
  const search = new URLSearchParams({ name: file.name, path: file.path, repo: file.repo })
  return getEditorPath('index.html') + '?' + search.toString()
}
