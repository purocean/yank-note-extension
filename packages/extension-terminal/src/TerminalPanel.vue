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
    <div class="close-btn" :title="i18n.t('close')" @click="handleClose">
      <svg-icon name="times" width="14px" height="14px" />
    </div>
    <div :class="{ wrapper: true, expanded: panelMode === 'maximized' }">
      <div class="container-wrapper">
        <div class="title" @dblclick="cyclePanelMode">{{ i18n.t('terminal-panel') }}</div>
        <div class="action-btn" :title="i18n.t('show-welcome')" @click="containerInstance?.showWelcome()">
          <svg-icon name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M0 80c0-26.5 21.5-48 48-48l480 0c26.5 0 48 21.5 48 48l0 272c0 26.5-21.5 48-48 48l-176 0 0 64 80 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L144 496c-8.8 0-16-7.2-16-16s7.2-16 16-16l80 0 0-64L48 400c-26.5 0-48-21.5-48-48L0 80zm56 24l0 224 464 0 0-224L56 104zm49 37.7c6.2-6.2 16.4-6.2 22.6 0l80 80c6.2 6.2 6.2 16.4 0 22.6l-80 80c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6L173.4 232 105 163.7c-6.2-6.2-6.2-16.4 0-22.6zM240 288l96 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-96 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>' width="12px" height="12px" />
        </div>
        <div v-if="stopAction" class="action-btn" style="left: 26px;" :title="stopAction.title" @click="stopAction.handler()">
          <svg-icon name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/></svg>' width="10px" height="10px" />
        </div>
        <div class="action-btn panel-mode-btn" :title="panelModeTitle" @click="cyclePanelMode">
          <svg-icon v-if="panelMode === 'floating'" name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M448 344v112a23.9 23.9 0 0 1 -24 24H312c-21.4 0-32.1-25.9-17-41l36.2-36.2L224 295.6 116.8 402.9 153 439c15.1 15.1 4.4 41-17 41H24a23.9 23.9 0 0 1 -24-24V344c0-21.4 25.9-32.1 41-17l36.2 36.2L184.5 256 77.2 148.7 41 185c-15.1 15.1-41 4.4-41-17V56a23.9 23.9 0 0 1 24-24h112c21.4 0 32.1 25.9 17 41l-36.2 36.2L224 216.4l107.2-107.3L295 73c-15.1-15.1-4.4-41 17-41h112a23.9 23.9 0 0 1 24 24v112c0 21.4-25.9 32.1-41 17l-36.2-36.2L263.5 256l107.3 107.3L407 327.1c15.1-15.2 41-4.5 41 16.9z"/></svg>' width="10px" height="10px" />
          <svg-icon v-else-if="panelMode === 'maximized'" name='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM64 96l0 320 160 0 0-320L64 96zm384 0L288 96l0 320 160 0c8.8 0 16-7.2 16-16l0-288c0-8.8-7.2-16-16-16z"/></svg>' width="12px" height="12px" />
        </div>
        <div ref="floatingContainerRef" class="container" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { containerActions, containerInstance, cyclePanelMode, i18n, moveContainerToTarget, panelMode, setFloatingTarget } from './lib'
import { ctx } from './runtime-api'

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
const floatingContainerRef = ref<HTMLElement | null>(null)
const stopAction = computed(() => containerActions.value.find(action => action.key === 'stop'))
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

function handleClose () {
  emit('update:visible', false)
}

onMounted(() => {
  if (floatingContainerRef.value) {
    setFloatingTarget(floatingContainerRef.value)
    if (panelMode.value !== 'embedded') {
      moveContainerToTarget()
    }
  }
})

onBeforeUnmount(() => {
  setFloatingTarget(null)
})

watch(panelMode, mode => {
  emit('update:panelMode', mode)
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
    overflow: hidden;
  }
}

.title {
  position: absolute;
  top: 0;
  left: 0;
  height: 24px;
  line-height: 24px;
  text-align: center;
  padding: 0 70px;
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
}

.panel-mode-btn {
  right: 23px;
  left: unset;
}

.container :deep(.terminal-container) {
  height: calc(100% - 25px);
  margin-top: 25px;
}
</style>
