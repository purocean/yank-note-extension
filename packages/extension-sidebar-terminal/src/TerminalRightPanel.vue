<template>
  <div class="terminal-right-panel" ref="containerRef">
    <!-- TerminalContainer will be moved here when in embedded mode -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { setEmbeddedTarget, panelMode, moveContainerToTarget } from './lib'

const containerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (containerRef.value) {
    setEmbeddedTarget(containerRef.value)
    if (panelMode.value === 'embedded') {
      moveContainerToTarget()
    }
  }
})

onBeforeUnmount(() => {
  setEmbeddedTarget(null)
})
</script>

<style lang="scss" scoped>
.terminal-right-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--g-color-backdrop);
  overflow: hidden;
}
</style>
