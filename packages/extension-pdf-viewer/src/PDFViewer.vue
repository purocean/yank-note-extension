<template>
  <div class="pdf-viewer">
    <iframe v-if="url" :src="url" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import { ctx } from '@yank-note/runtime-api'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'

function getAttachmentURL (doc: Doc, opts: { origin: boolean } = { origin: false }) {
  if (doc.type !== 'file') {
    throw new Error('Document type must be file')
  }

  const fileName = ctx.utils.removeQuery(doc.name)
  const repo = doc.repo
  const filePath = doc.path
  const uri = `/api/attachment/${encodeURIComponent(fileName)}?repo=${repo}&path=${encodeURIComponent(filePath)}`

  if (opts.origin) {
    return `${window.location.origin}${uri}`
  }

  return uri
}

const url = ref('')

watchEffect(() => {
  const currentFile = ctx.store.state.currentFile

  if (currentFile && currentFile.name.toLowerCase().endsWith('.pdf')) {
    url.value = getAttachmentURL(currentFile)
  } else {
    url.value = ''
  }
})
</script>

<style scoped>
.pdf-viewer {
  height: 100%;
  width: 100%;
}

.pdf-viewer > iframe {
  height: 100%;
  width: 100%;
  border: none;
}
</style>
