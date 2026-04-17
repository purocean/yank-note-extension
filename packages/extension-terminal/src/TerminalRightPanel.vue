<template>
  <div ref="containerRef" class="terminal-right-panel" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { moveContainerToTarget, panelMode, setEmbeddedTarget } from './lib'

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
  background: var(--g-color-backdrop);
  overflow: hidden;
}
</style>
