<template>
  <div class="custom-editor">
    <iframe :id="CUSTOM_EDITOR_IFRAME_ID" v-if="url" :src="url" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import { ctx } from '@yank-note/runtime-api'
import { CUSTOM_EDITOR_IFRAME_ID, buildEditorSrcdoc, supported } from './drawio'

const url = ref('')

watchEffect(() => {
  const currentFile = ctx.store.state.currentFile

  if (supported(currentFile)) {
    const srcdoc = buildEditorSrcdoc(currentFile!, false)
    url.value = ctx.embed.buildSrc(srcdoc, 'drawio editor')
  } else {
    url.value = ''
  }
})
</script>

<style scoped>
.custom-editor {
  height: 100%;
  width: 100%;
  border-top: 1px var(--g-color-70) solid;
}

.custom-editor > iframe {
  height: 100%;
  width: 100%;
  border: none;
}
</style>
