<template>
  <div
    v-show="visible && panelMode !== 'embedded'"
    class="fixed-float"
    v-auto-z-index="{ layer: 'popup' }"
    @click.stop
    :style="{
      top: ctx.env.isElectron ? '66px' : '36px',
      right: '20px',
    }"
  >
    <div class="close-btn" @click="handleClose" :title="i18n.t('close')">
      <svg-icon name="times" width="14px" height="14px" />
    </div>
    <div :class="{ wrapper: true, expanded: panelMode === 'maximized' }">
      <div class="container-wrapper">
        <div class="title" @dblclick="cyclePanelMode">{{ i18n.t('opencode-panel') }}</div>
        <div v-if="stopAction" class="action-btn" @click="stopAction.handler" :title="stopAction.title">
          <svg-icon name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/></svg>' width="10px" height="10px" />
        </div>
        <div v-if="openBrowserAction" class="action-btn" @click="openBrowserAction.handler" :title="openBrowserAction.title" style="left: 26px;">
          <svg-icon name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M352 0c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9L370.7 96 201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L416 141.3l41.4 41.4c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V32c0-17.7-14.3-32-32-32H352zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/></svg>' width="9px" height="9px" />
        </div>
        <div v-if="restartAction" class="restart-btn" @click="restartAction.handler" :title="restartAction.title">
          <span class="restart-hint">{{ restartAction.meta?.hint }}</span>
        </div>
        <div v-if="addContextAction" class="context-btn" @click="addContextAction.handler" :title="addContextAction.title">
          <span class="context-info">{{ addContextAction.meta?.displayFileName }}<template v-if="addContextAction.meta?.selectionLines">#{{ addContextAction.meta.selectionLines }}</template></span>
          <svg-icon name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg>' width="10px" height="10px" />
        </div>
        <div class="action-btn panel-mode-btn" @click="cyclePanelMode" :title="panelModeTitle" style="right: 23px; left: unset; padding: 5px;">
          <!-- Floating mode icon -->
          <svg-icon v-if="panelMode === 'floating'" name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M448 344v112a23.9 23.9 0 0 1 -24 24H312c-21.4 0-32.1-25.9-17-41l36.2-36.2L224 295.6 116.8 402.9 153 439c15.1 15.1 4.4 41-17 41H24a23.9 23.9 0 0 1 -24-24V344c0-21.4 25.9-32.1 41-17l36.2 36.2L184.5 256 77.2 148.7 41 185c-15.1 15.1-41 4.4-41-17V56a23.9 23.9 0 0 1 24-24h112c21.4 0 32.1 25.9 17 41l-36.2 36.2L224 216.4l107.2-107.3L295 73c-15.1-15.1-4.4-41 17-41h112a23.9 23.9 0 0 1 24 24v112c0 21.4-25.9 32.1-41 17l-36.2-36.2L263.5 256l107.3 107.3L407 327.1c15.1-15.2 41-4.5 41 16.9z"/></svg>' width="10px" height="10px" />
          <!-- Maximized mode icon -->
          <svg-icon v-else-if="panelMode === 'maximized'" name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M200 288H88c-21.4 0-32.1 25.8-17 41l32.9 31-99.2 99.3c-6.2 6.2-6.2 16.4 0 22.6l25.4 25.4c6.2 6.2 16.4 6.2 22.6 0L152 408l31.1 33c15.1 15.1 40.9 4.4 40.9-17V312c0-13.3-10.7-24-24-24zm112-64h112c21.4 0 32.1-25.9 17-41l-33-31 99.3-99.3c6.2-6.2 6.2-16.4 0-22.6L481.9 4.7c-6.2-6.2-16.4-6.2-22.6 0L360 104l-31.1-33C313.8 55.9 288 66.6 288 88v112c0 13.3 10.7 24 24 24zm96 136l33-31.1c15.1-15.1 4.4-40.9-17-40.9H312c-13.3 0-24 10.7-24 24v112c0 21.4 25.9 32.1 41 17l31-32.9 99.3 99.3c6.2 6.2 16.4 6.2 22.6 0l25.4-25.4c6.2-6.2 6.2-16.4 0-22.6L408 360zM183 71.1L152 104 52.7 4.7c-6.2-6.2-16.4-6.2-22.6 0L4.7 30.1c-6.2 6.2-6.2 16.4 0 22.6L104 152l-33 31.1C55.9 198.2 66.6 224 88 224h112c13.3 0 24-10.7 24-24V88c0-21.3-25.9-32-41-16.9z"/></svg>' width="10px" height="10px" />
          <!-- Embedded mode icon (sidebar) -->
          <svg-icon v-else name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zm288 0l0 320 160 0c8.8 0 16-7.2 16-16l0-288c0-8.8-7.2-16-16-16l-160 0z"/></svg>' width="10px" height="10px" />
        </div>
        <div class="container" ref="floatingContainerRef">
          <!-- OpenCodeContainer will be moved here for floating/maximized modes -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ctx } from '@yank-note/runtime-api'
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { i18n, panelMode, cyclePanelMode, setFloatingTarget, moveContainerToTarget, containerInstance, containerActions, type ActionButton } from './lib'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const { SvgIcon } = ctx.components

// eslint-disable-next-line no-undef
const props = defineProps<{
  visible: Ref<boolean>
}>()

// eslint-disable-next-line no-undef, func-call-spacing
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:panelMode', value: string): void
}>()

const visible = computed(() => props.visible.value)

function handleClose () {
  emit('update:visible', false)
}

const floatingContainerRef = ref<HTMLElement | null>(null)

// Computed actions from shared state
const stopAction = computed(() => containerActions.value.find(a => a.key === 'stop'))
const openBrowserAction = computed(() => containerActions.value.find(a => a.key === 'open-browser'))
const restartAction = computed(() => containerActions.value.find(a => a.key === 'restart'))
const addContextAction = computed(() => containerActions.value.find(a => a.key === 'add-context'))

// Panel mode title for tooltip
const panelModeTitle = computed(() => {
  switch (panelMode.value) {
    case 'floating':
      return i18n.t('panel-mode-maximized')
    case 'maximized':
      return i18n.t('panel-mode-embedded')
    case 'embedded':
      return i18n.t('panel-mode-floating')
    default:
      return ''
  }
})

// Set floating target on mount
onMounted(() => {
  if (floatingContainerRef.value) {
    setFloatingTarget(floatingContainerRef.value)
    // If not in embedded mode, move container here
    if (panelMode.value !== 'embedded') {
      moveContainerToTarget()
    }
  }
})

onBeforeUnmount(() => {
  setFloatingTarget(null)
})

// Watch panel mode changes and emit event
watch(panelMode, (mode) => {
  emit('update:panelMode', mode)
  // Fit terminal after container is moved
  nextTick(() => {
    containerInstance.value?.fitXterm()
  })
})
</script>

<style lang="scss" scoped>
.fixed-float {
  position: fixed;
  padding: 1px;
  margin: 0;
  background: var(--g-color-backdrop);
  border: 1px var(--g-color-84) solid;
  border-left: 0;
  border-top: 0;
  color: var(--g-foreground-color);
  min-width: 50px;
  cursor: default;
  box-shadow: rgba(0, 0, 0, 0.3) 2px 2px 10px;
  border-radius: var(--g-border-radius);
  overflow: hidden;
  backdrop-filter: var(--g-backdrop-filter);

  .close-btn {
    position: absolute;
    right: 3px;
    top: 3px;
    width: 20px;
    height: 20px;
    padding: 3px;
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

.wrapper {
  width: 38vw;
  max-width: 38vw;

  &.expanded {
    width: calc(100vw - 40px);
    max-width: 100vw;

    .container-wrapper {
      max-height: 100vh;
    }
  }
}

.container-wrapper {
  width: 100%;
  height: calc(100vh - 100px);
  max-height: calc(100vh - 100px);
  position: relative;

  .container {
    width: 100%;
    height: 100%;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
  }
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
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--g-color-0);
    background-color: var(--g-color-80);
    border-radius: 50%;
  }

  :deep(.svg-icon) {
    display: block;
  }
}

.restart-btn,
.context-btn {
  position: absolute;
  left: 49px;
  top: 2px;
  height: 16px;
  margin-top: 2px;
  padding: 0px 6px;
  box-sizing: border-box;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 10px;

  &:hover {
    background-color: var(--g-color-80);
  }

  :deep(.svg-icon) {
    flex-shrink: 0;
  }
}

.restart-btn {
  color: rgba(230, 126, 34, 0.85);
  max-width: 220px;

  .restart-hint {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.context-btn {
  color: var(--g-color-30);
  max-width: 180px;

  &:hover {
    color: var(--g-color-0);
  }

  .context-info {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
