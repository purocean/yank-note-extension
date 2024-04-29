<template>
  <div class="nes-emulator">
    <iframe v-if="url" :src="url" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect, nextTick } from 'vue'
import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'

const url = ref('')

watchEffect(() => {
  const currentFile = ctx.store.state.currentFile

  url.value = ''
  nextTick(() => {
    if (currentFile && currentFile.name.toLowerCase().endsWith('.nes')) {
      url.value = getExtensionBasePath(__EXTENSION_ID__) + '/emulator/index.html#/run/' + encodeURIComponent(ctx.base.getAttachmentURL(currentFile))
    }

    nextTick(() => {
      const iframe: HTMLIFrameElement | null = document.querySelector('.nes-emulator > iframe')
      if (iframe) {
        iframe.focus()
      }
    })
  })

})
</script>

<style scoped>
.nes-emulator {
  height: 100%;
  width: 100%;
  border-top: 1px var(--g-color-70) solid;
}

.nes-emulator > iframe {
  height: 100%;
  width: 100%;
  border: none;
}
</style>
