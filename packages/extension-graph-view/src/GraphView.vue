<template>
  <index-status :title="title + stats" @status-change="onStatusChange" disable-check-current-file :class="{ wrapper: true, expanded }">
    <div class="container-wrapper">
      <div v-show="loading" class="loading">Loading...</div>
      <template v-if="!loading">
        <div class="title" @dblclick="expanded = !expanded">{{ graphTitle }}</div>
        <div class="action-btn" @click="triggerMenu" :title="$t('search')">
          <svg-icon name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M16 132h416c8.8 0 16-7.2 16-16V76c0-8.8-7.2-16-16-16H16C7.2 60 0 67.2 0 76v40c0 8.8 7.2 16 16 16zm0 160h416c8.8 0 16-7.2 16-16v-40c0-8.8-7.2-16-16-16H16c-8.8 0-16 7.2-16 16v40c0 8.8 7.2 16 16 16zm0 160h416c8.8 0 16-7.2 16-16v-40c0-8.8-7.2-16-16-16H16c-8.8 0-16 7.2-16 16v40c0 8.8 7.2 16 16 16z"/></svg>' width="12px" height="12px" />
        </div>
        <div class="action-btn" @click="search" :title="$t('search')" style="left: 23px">
          <svg-icon name="search-solid" width="12px" height="12px" />
        </div>
        <div class="action-btn" @click="expanded = !expanded" :title="$t('search')" style="right: 23px; left: unset; padding: 5px;">
          <svg-icon v-if="expanded" name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M200 288H88c-21.4 0-32.1 25.8-17 41l32.9 31-99.2 99.3c-6.2 6.2-6.2 16.4 0 22.6l25.4 25.4c6.2 6.2 16.4 6.2 22.6 0L152 408l31.1 33c15.1 15.1 40.9 4.4 40.9-17V312c0-13.3-10.7-24-24-24zm112-64h112c21.4 0 32.1-25.9 17-41l-33-31 99.3-99.3c6.2-6.2 6.2-16.4 0-22.6L481.9 4.7c-6.2-6.2-16.4-6.2-22.6 0L360 104l-31.1-33C313.8 55.9 288 66.6 288 88v112c0 13.3 10.7 24 24 24zm96 136l33-31.1c15.1-15.1 4.4-40.9-17-40.9H312c-13.3 0-24 10.7-24 24v112c0 21.4 25.9 32.1 41 17l31-32.9 99.3 99.3c6.2 6.2 16.4 6.2 22.6 0l25.4-25.4c6.2-6.2 6.2-16.4 0-22.6L408 360zM183 71.1L152 104 52.7 4.7c-6.2-6.2-16.4-6.2-22.6 0L4.7 30.1c-6.2 6.2-6.2 16.4 0 22.6L104 152l-33 31.1C55.9 198.2 66.6 224 88 224h112c13.3 0 24-10.7 24-24V88c0-21.3-25.9-32-41-16.9z"/></svg>' width="10px" height="10px" />
          <svg-icon v-else name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M448 344v112a23.9 23.9 0 0 1 -24 24H312c-21.4 0-32.1-25.9-17-41l36.2-36.2L224 295.6 116.8 402.9 153 439c15.1 15.1 4.4 41-17 41H24a23.9 23.9 0 0 1 -24-24V344c0-21.4 25.9-32.1 41-17l36.2 36.2L184.5 256 77.2 148.7 41 185c-15.1 15.1-41 4.4-41-17V56a23.9 23.9 0 0 1 24-24h112c21.4 0 32.1 25.9 17 41l-36.2 36.2L224 216.4l107.2-107.3L295 73c-15.1-15.1-4.4-41 17-41h112a23.9 23.9 0 0 1 24 24v112c0 21.4-25.9 32.1-41 17l-36.2-36.2L263.5 256l107.3 107.3L407 327.1c15.1-15.2 41-4.5 41 16.9z"/></svg>' width="10px" height="10px" />
        </div>
      </template>
      <div ref="container" class="container" />
    </div>
  </index-status>
</template>

<script lang="ts">
import { ctx } from '@yank-note/runtime-api'
import type { PositionState } from '@yank-note/runtime-api/types/types/renderer/types'
import Graph from 'graphology'
import Sigma from 'sigma'
import { EdgeArrowProgram } from 'sigma/rendering'
import { NodeSquareProgram } from '@sigma/node-square'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import circular from 'graphology-layout/circular'
import { i18n } from './lib'
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

let _independentNodesVisible = true
let _tagsVisible = true
</script>

<script setup lang="ts">
type Node = {
    key: string;
    label: string;
    type?: 'square';
    x: number;
    y: number;
    color: string;
    zIndex: number;
    size: number;
    forceLabel: boolean;
    hidden?: boolean;
  }

type Edge = {
  source: string;
  target: string;
  zIndex: number;
  color: string;
  size: number;
  type: 'arrow';
  directed: true;
  position?: PositionState;
}

const { IndexStatus, SvgIcon } = ctx.components

ctx.i18n.useI18n()

const container = ref<HTMLElement | null>(null)
const title = computed(() => i18n.$t.value('graph-view-of', ctx.store.state.currentRepo?.name || ''))
const stats = ref('')
const loading = ref(false)
const status = ref('')
const expanded = ref(false)
const independentNodesVisible = ref(_independentNodesVisible)
const tagsVisible = ref(_tagsVisible)
const hoverState = shallowRef<{ node: string, neighbors: Set<string>, edges: Set<string>, nodeSelected: boolean, currentNode: string } | null>(null)
const graphTitle = computed(() => {
  return hoverState.value?.node || i18n.t('graph-view')
})

let graph: Graph<Node, Edge> | null = null
let instance: Sigma<Graph<Node, Edge>> | null = null

function clean () {
  hoverState.value = null
  stats.value = ''
  instance?.kill()
  instance = null
  graph = null
}

function getRandomColor () {
  const colors = [
    '#f44336',
    '#e91e63',
    '#9c27b0',
    '#673ab7',
    '#2196f3',
    '#03a9f4',
    '#00bcd4',
    '#009688',
    '#4caf50',
    '#8bc34a',
    '#cddc39',
    '#ffc107',
    '#ff9800',
    '#ff5722',
    '#607d8b',
  ]

  return colors[Math.floor(Math.random() * colors.length)]
}

async function refresh () {
  clean()

  loading.value = true

  if (status.value !== 'indexed') {
    return
  }

  const darkMode = ctx.theme.getColorScheme() === 'dark'

  const dm = ctx.indexer.getDocumentsManager()
  const repo = ctx.store.state.currentRepo?.name
  if (!repo) {
    return
  }

  graph = new Graph<Node, Edge, any>({
    allowSelfLoops: true,
    multi: true,
  })

  let globalZIndex = 1
  const edges: Edge[] = []
  let dragState: { node: string, nodeX: number, nodeY: number, x: number, y: number, moved: boolean } | null = null

  await dm.getTable().where({ repo }).each(doc => {
    doc.links.forEach(link => {
      if (link.internal && doc.path !== link.internal) {
        edges.push({
          source: doc.path,
          target: link.internal,
          zIndex: globalZIndex++,
          color: darkMode ? '#444' : '#ddd',
          size: 1,
          type: 'arrow',
          directed: true,
          position: link.position
        })
      }
    })

    const label = /^(?:index|readme)\.md$/i.test(doc.name) ? doc.path : doc.name
    graph!.addNode(doc.path, {
      key: doc.path,
      label,
      x: 0,
      y: 0,
      color: '#888',
      zIndex: globalZIndex++,
      size: 0,
      forceLabel: false
    })

    if (tagsVisible.value) {
      (doc.tags || []).forEach(tag => {
        const key = tag
        if (!graph!.hasNode(key)) {
          graph!.addNode(key, {
            key,
            label: tag,
            x: 0,
            y: 0,
            color: '#888',
            zIndex: globalZIndex++,
            size: 0,
            forceLabel: false,
          })
        }

        edges.push({
          target: key,
          source: doc.path,
          zIndex: globalZIndex++,
          color: '#888',
          size: 0,
          type: 'arrow',
          directed: true,
        })
      })
    }
  })

  edges.forEach(edge => {
    if (!graph!.hasNode(edge.source) || !graph!.hasNode(edge.target)) {
      return
    }

    graph!.addEdge(edge.source, edge.target, edge)
  })

  let minDegree = 0
  let maxDegree = 0
  graph.forEachNode(node => {
    const degree = graph!.degree(node)
    if (degree > maxDegree) {
      maxDegree = degree
    }

    if (degree < minDegree) {
      minDegree = degree
    }

    if (!independentNodesVisible.value && degree === 0) {
      graph!.dropNode(node)
    }
  })

  stats.value = ` (${graph.order} nodes, ${graph.size} edges)`

  const minSize = 2
  const maxSize = 15

  graph.forEachNode((node) => {
    const degree = graph!.degree(node)
    graph!.setNodeAttribute(
      node,
      'size',
      minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize),
    )

    const size = Math.min(Math.log(degree + 1.3) * 8 + 4, 400)
    graph!.setNodeAttribute(node, 'size', size)

    if (degree > 0) {
      graph!.setNodeAttribute(node, 'color', getRandomColor())
    }
  })

  circular.assign(graph, { scale: 1300 })

  const settings = forceAtlas2.inferSettings(graph)

  forceAtlas2.assign(graph, {
    iterations: 50,
    settings: {
      ...settings,
      barnesHutOptimize: true,
      linLogMode: true,
      outboundAttractionDistribution: true,
    }
  })

  instance = new Sigma<Graph<Node, Edge>>(graph as any, container.value!, {
    autoRescale: true,
    allowInvalidContainer: true,
    labelColor: { color: '#888' },
    zoomToSizeRatioFunction: (ratio: number) => ratio * 0.8,
    itemSizesReference: 'positions',
    zIndex: true,
    edgeProgramClasses: {
      default: EdgeArrowProgram,
    },
    nodeProgramClasses: {
      square: NodeSquareProgram,
    },
    nodeReducer (node, data) {
      const attrs = { ...data } as unknown as Node

      if (hoverState.value) {
        if (hoverState.value.node === node) {
          attrs.zIndex = globalZIndex++
          attrs.label = attrs.key + ` (${hoverState.value.neighbors.size})`
          attrs.forceLabel = true
          attrs.type = 'square'
        } else if (hoverState.value.neighbors.has(node)) {
          attrs.zIndex = globalZIndex++
          attrs.forceLabel = false
        } else if (hoverState.value.currentNode !== node) {
          attrs.label = ''
          attrs.forceLabel = false
          attrs.type = undefined

          attrs.color = darkMode ? 'rgba(10, 10, 10, 0.05)' : 'rgba(0, 0, 0, 0.05)'
        } else {
          attrs.label = attrs.key
        }
      } else {
        attrs.forceLabel = false
      }

      return attrs
    },
    edgeReducer (edge, data) {
      const attrs = { ...data } as unknown as Edge

      if (hoverState.value) {
        if (hoverState.value.edges.has(edge)) {
          const source = graph!.getSourceAttributes(edge)
          attrs.zIndex = globalZIndex++
          attrs.size = 2
          attrs.color = source.color
        } else {
          attrs.color = 'rgba(0, 0, 0, 0)'
        }
      }

      return attrs
    },
  })

  instance.on('enterNode', e => {
    const neighbors = graph!.neighbors(e.node)
    const edges = graph!.edges(e.node)

    if (!hoverState.value?.nodeSelected) {
      hoverState.value = { node: e.node, neighbors: new Set(neighbors), edges: new Set(edges), nodeSelected: false, currentNode: e.node }
    }

    if (hoverState.value) {
      hoverState.value = { ...hoverState.value, currentNode: e.node }
    }

    instance?.refresh({ skipIndexation: true })
    container.value!.style.cursor = 'pointer'
  })

  instance.on('leaveNode', () => {
    if (hoverState.value) {
      hoverState.value = { ...hoverState.value, currentNode: '' }

      if (!hoverState.value.nodeSelected) {
        hoverState.value = null
      }
    }

    instance?.refresh({ skipIndexation: true, })
    container.value!.style.cursor = 'default'
  })

  instance.on('clickStage', () => {
    hoverState.value = null
    instance?.refresh({ skipIndexation: true, })
  })

  instance.on('upNode', e => {
    if (!dragState || !dragState.moved) {
      const node = graph!.getNodeAttributes(e.node)

      let position: PositionState | undefined
      if (hoverState.value?.nodeSelected && hoverState.value.neighbors.has(e.node)) {
        for (const edge of hoverState.value.edges) {
          const edgeData = graph!.getEdgeAttributes(edge)
          if (edgeData.target === e.node) {
            position = edgeData.position
          }
        }
      }

      if (hoverState.value) {
        hoverState.value = { node: e.node, neighbors: new Set(graph!.neighbors(e.node)), edges: new Set(graph!.edges(e.node)), nodeSelected: true, currentNode: e.node }
        instance?.refresh({ skipIndexation: true, })
      }

      ctx.doc.switchDoc({
        type: 'file',
        repo: ctx.store.state.currentRepo!.name,
        path: node.key,
        name: node.label,
      }, { position })
    }

    dragState = null
    e.preventSigmaDefault()
  })

  instance.on('upStage', e => {
    dragState = null
    e.preventSigmaDefault()
  })

  instance.on('downNode', e => {
    const node = graph!.getNodeAttributes(e.node)
    dragState = { node: e.node, nodeX: node.x, nodeY: node.y, x: -1, y: -1, moved: false }
    e.preventSigmaDefault()
  })

  instance.on('leaveStage', () => {
    dragState = null
  })

  instance.on('moveBody', e => {
    if (dragState) {
      e.preventSigmaDefault()

      const { x: eX, y: eY } = instance!.viewportToGraph({ x: e.event.x, y: e.event.y })

      if (dragState.x === -1 && dragState.y === -1) {
        dragState.x = eX
        dragState.y = eY
        return
      }

      const dx = eX - dragState.x
      const dy = eY - dragState.y

      graph!.updateNodeAttributes(dragState.node, attrs => {
        const x = attrs.x + dx
        const y = attrs.y + dy

        if (dragState) {
          dragState.moved = Math.max(Math.abs(x - dragState.nodeX), Math.abs(y - dragState.nodeY)) > 5
        }

        attrs.x = x
        attrs.y = y

        return attrs
      })

      dragState.x = eX
      dragState.y = eY

      instance?.refresh({ skipIndexation: true })
    }
  })

  loading.value = false
}

async function selectCurrentNode () {
  await ctx.utils.sleep(0)
  if (graph && instance && ctx.store.state.currentFile?.path && ctx.store.state.currentFile?.repo === ctx.store.state.currentRepo?.name) {
    const node = ctx.store.state.currentFile.path
    hoverState.value = { node: node, neighbors: new Set(graph.neighbors(node)), edges: new Set(graph.edges(node)), nodeSelected: true, currentNode: node }
    instance.refresh({ skipIndexation: true })
  }
}

async function onStatusChange (val: string) {
  status.value = val
  await nextTick()
  await refresh()
  await selectCurrentNode()
}

function search () {
  ctx.routines.chooseDocument().then(doc => {
    if (!doc) {
      return
    }

    hoverState.value = {
      node: doc.path,
      neighbors: new Set(graph!.neighbors(doc.path)),
      edges: new Set(graph!.edges(doc.path)),
      nodeSelected: true,
      currentNode: doc.path
    }

    instance?.refresh({ skipIndexation: true })
  })
}

function triggerMenu () {
  ctx.ui.useContextMenu().show([
    {
      id: 'refresh',
      type: 'normal',
      label: i18n.t('refresh'),
      onClick: refresh,
    },
    { type: 'separator' },
    {
      id: 'show-independent-nodes',
      type: 'normal',
      checked: independentNodesVisible.value,
      label: i18n.t('show-independent-nodes'),
      onClick () {
        independentNodesVisible.value = !independentNodesVisible.value
      },
    },
    {
      id: 'show-tags',
      type: 'normal',
      checked: tagsVisible.value,
      label: i18n.t('show-tags'),
      onClick () {
        tagsVisible.value = !tagsVisible.value
      },
    },
  ])
}

watch(expanded, () => {
  nextTick(() => {
    instance?.refresh({ skipIndexation: true })
  })
})

watch(independentNodesVisible, (val) => {
  _independentNodesVisible = val
  refresh()
})

watch(tagsVisible, (val) => {
  _tagsVisible = val
  refresh()
})

ctx.registerHook('THEME_CHANGE', refresh)

watch(() => ctx.store.state.currentFile?.path, selectCurrentNode)

onBeforeUnmount(() => {
  clean()
  ctx.removeHook('THEME_CHANGE', selectCurrentNode)
})
</script>

<style lang="scss" scoped>
.wrapper {
  width: 500px;
  max-width: 35vw;

  &.expanded {
    width: calc(100vw - 40px);
    max-width: 100vw;

    .container-wrapper {
      height: calc(100vh - 140px);
      max-height: 100vh;
    }
  }
}

.container-wrapper {
  width: 100%;
  height: calc(100vh - 240px);
  max-height: 50vh;

  .container {
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .loading {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn {
    position: absolute;
    left: 3px;
    top: 2px;
    width: 20px;
    height: 20px;
    padding: 4px;
    box-sizing: border-box;
    color: var(--g-color-30);
    z-index: 10;

    &:hover {
      color: var(--g-color-0);
      background-color: var(--g-color-80);
      border-radius: 50%;
    }

    .svg-icon {
      display: block;
    }
  }
}

.wrapper + ::v-deep(.action) {
  position: absolute;
  right: 10px;
  bottom: 10px;
}

.title {
  position: absolute;
  top: 0;
  left: 0;
  height: 24px;
  line-height: 24px;
  text-align: center;
  padding: 0 60px;
  box-sizing: border-box;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  background: rgba(var(--g-color-90-rgb), 0.94);
  border-bottom: var(--g-color-85) 1px solid;
  z-index: 8;
  color: var(--g-color-10);
  font-size: 13px;
  user-select: none;
}
</style>
