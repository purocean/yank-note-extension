<template>
  <div class="custom-editor">
    <iframe :id="CUSTOM_EDITOR_IFRAME_ID" v-if="url" :src="url" />
  </div>
</template>

<script lang="ts" setup>
import { ctx } from '@yank-note/runtime-api'
import { CUSTOM_EDITOR_IFRAME_ID, buildEditorUrl, supported } from './lib'
const { nextTick, ref, watchEffect } = ctx.lib.vue

const url = ref('')

watchEffect(() => {
  const currentFile = ctx.store.state.currentFile
  url.value = ''

  nextTick(() => {
    if (currentFile && supported(currentFile)) {
      url.value = buildEditorUrl(currentFile)
    }
  })
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
