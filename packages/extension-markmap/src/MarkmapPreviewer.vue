<template>
  <div class="markmap-preview-wrapper">
    <markmap-preview :source="source" />
  </div>
</template>

<script lang="ts" setup>
import { ctx } from '@yank-note/runtime-api'
import MarkmapPreview from './MarkmapPreview.vue'

const source = ctx.lib.vue.ref('')

function render () {
  source.value = ctx.view.getRenderEnv()?.source || ''
}

ctx.registerHook('VIEW_RENDERED', render)

function clean () {
  ctx.removeHook('VIEW_RENDERED', render)
}

ctx.lib.vue.onMounted(render)
ctx.lib.vue.onBeforeUnmount(clean)
</script>

<style>
.markmap-preview-wrapper {
  transform: translateX(0);
  display: flex;
  align-items: center;
  height: 100%;
  /* TODO theme */
  background: #fff;
}

.markmap-preview-wrapper:hover > .markmap-preview-action {
  opacity: 1;
}
</style>
