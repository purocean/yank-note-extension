<template>
  <index-status :title="title + stats" @status-change="onStatusChange" disable-check-current-file style="width: 800px; max-width: 40vw;">
    <div ref="container" class="container">
      <div v-show="loading" class="loading">Loading...</div>
    </div>
  </index-status>
</template>

<script setup lang="ts">
import { ctx } from '@yank-note/runtime-api'
import type { PositionState } from '@yank-note/runtime-api/types/types/renderer/types'
import Graph from 'graphology'
import Sigma from 'sigma'
import { EdgeArrowProgram } from 'sigma/rendering'
import { NodeSquareProgram } from '@sigma/node-square'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import circular from 'graphology-layout/circular'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { i18n } from './lib'

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

const IndexStatus = ctx.components.IndexStatus

const container = ref<HTMLElement | null>(null)
const title = computed(() => i18n.$t.value('graph-view-of', ctx.store.state.currentRepo?.name || ''))
const stats = ref('')
const loading = ref(false)
const status = ref('')

let graph: Graph<Node, Edge> | null = null
let instance: Sigma<Graph<Node, Edge>> | null = null
let hoverState: { node: string, neighbors: string[], edges: string[], nodeSelected: boolean, currentNode: string } | null = null

function clean () {
  hoverState = null
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
  const nodes: Node[] = []
  const edges: Edge[] = []
  let edgeCount = 0
  let dragState: { node: string, nodeX: number, nodeY: number, x: number, y: number, moved: boolean } | null = null

  await dm.getTable().where({ repo }).each(doc => {
    doc.links.forEach(link => {
      if (link.internal && doc.path !== link.internal) {
        edges.push({ source: doc.path, target: link.internal, zIndex: globalZIndex++, color: darkMode ? '#444' : '#ddd', size: 1, type: 'arrow', directed: true, position: link.position })
      }
    })

    const label = /^(?:index|readme)\.md$/i.test(doc.name) ? doc.path : doc.name

    nodes.push({ key: doc.path, label, x: 0, y: 0, color: '#888', zIndex: globalZIndex++, size: 0, forceLabel: false })
  })

  nodes.forEach(node => {
    graph!.addNode(node.key, node)
  })

  edges.forEach(edge => {
    if (!graph!.hasNode(edge.source) || !graph!.hasNode(edge.target)) {
      return
    }

    edgeCount++

    graph!.addEdge(edge.source, edge.target, edge)
  })

  stats.value = ` (${nodes.length} nodes, ${edgeCount} edges)`

  const degrees = graph.nodes().map((node) => graph!.degree(node))
  const minDegree = Math.min(...degrees)
  const maxDegree = Math.max(...degrees)
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

  circular.assign(graph)

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
    allowInvalidContainer: true,
    labelColor: { color: '#888' },
    zoomToSizeRatioFunction: (ratio: number) => ratio,
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

      if (hoverState) {
        if (hoverState.node === node) {
          attrs.zIndex = globalZIndex++
          attrs.label = attrs.key + ` (${hoverState.neighbors.length})`
          attrs.forceLabel = true
          attrs.type = 'square'
        } else if (hoverState.neighbors.includes(node)) {
          attrs.zIndex = globalZIndex++
          attrs.forceLabel = true
        } else if (hoverState.currentNode !== node) {
          attrs.label = ''
          attrs.forceLabel = false

          attrs.color = darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)'
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

      if (hoverState) {
        if (hoverState.edges.includes(edge)) {
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

    if (!hoverState?.nodeSelected) {
      hoverState = { node: e.node, neighbors, edges, nodeSelected: false, currentNode: e.node }
    }

    if (hoverState) {
      hoverState.currentNode = e.node
    }

    instance?.refresh({ skipIndexation: true })
    container.value!.style.cursor = 'pointer'
  })

  instance.on('leaveNode', () => {
    if (hoverState) {
      hoverState.currentNode = ''

      if (!hoverState.nodeSelected) {
        hoverState = null
      }
    }

    instance?.refresh({ skipIndexation: true, })
    container.value!.style.cursor = 'default'
  })

  instance.on('clickStage', () => {
    hoverState = null
    instance?.refresh({ skipIndexation: true, })
  })

  instance.on('upNode', e => {
    if (!dragState || !dragState.moved) {
      const node = graph!.getNodeAttributes(e.node)

      let position: PositionState | undefined
      if (hoverState?.nodeSelected && hoverState.neighbors.includes(e.node)) {
        for (const edge of hoverState.edges) {
          const edgeData = graph!.getEdgeAttributes(edge)
          if (edgeData.target === e.node) {
            position = edgeData.position
          }
        }
      }

      if (hoverState) {
        hoverState = { node: e.node, neighbors: graph!.neighbors(e.node), edges: graph!.edges(e.node), nodeSelected: true, currentNode: e.node }
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
    hoverState = { node: node, neighbors: graph.neighbors(node), edges: graph.edges(node), nodeSelected: true, currentNode: node }
    instance.refresh({ skipIndexation: true })
  }
}

async function onStatusChange (val: string) {
  status.value = val
  await nextTick()
  await refresh()
  await selectCurrentNode()
}

ctx.registerHook('THEME_CHANGE', refresh)

watch(() => ctx.store.state.currentFile?.path, selectCurrentNode)

onBeforeUnmount(() => {
  clean()
  ctx.removeHook('THEME_CHANGE', selectCurrentNode)
})
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: calc(100vh - 240px);

  .loading {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.indexer-status + ::v-deep(.action) {
  position: absolute;
  right: 10px;
  bottom: 10px;
}
</style>
