<template>
  <div class="pdf-viewer">
    <iframe v-if="url" :src="url" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import { ctx } from '@yank-note/runtime-api'

const url = ref('')

watchEffect(() => {
  const currentFile = ctx.store.state.currentFile

  if (currentFile && currentFile.name.toLowerCase().endsWith('.pdf')) {
    url.value = ctx.base.getAttachmentURL(currentFile)
  } else {
    url.value = ''
  }
})
</script>

<style scoped>
.pdf-viewer {
  height: 100%;
  width: 100%;
  border-top: 1px var(--g-color-70) solid;
}

.pdf-viewer > iframe {
  height: 100%;
  width: 100%;
  border: none;
}
</style>
