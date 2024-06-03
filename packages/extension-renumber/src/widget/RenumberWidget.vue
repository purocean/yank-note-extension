<template>
  <div ref="wrapperRef" class="widget" @mousemove.capture.stop>
    <div class="content">
      <h4>{{ $t('renumber') }}</h4>
      <svg-icon name="times" class="close-icon" @click="close" title="Close" />
      <p>
        更改有序列表的起始编号，更多功能开发中……
      </p>
      <div class="actions">
        <button v-if="!finished" class="small primary tr" @click="process">{{ $t('modify') }}</button>
        <template v-else>
          <button class="small primary tr" @click="accept">{{ $t('accept') }}</button>
          <button class="small tr" @click="undo">{{ $t('discard') }}</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ctx } from '@yank-note/runtime-api'
import { defineEmits, ref, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { i18n } from '../core'
import { executeEdit } from '@/actions'

const SvgIcon = ctx.components.SvgIcon

const { $t } = i18n

const wrapperRef = ref<HTMLElement>()
const emits = defineEmits<{(event: 'layout', height: number): void, (event: 'dispose'): void}>()

const image = shallowRef<{ src: string, blob: Blob }>()

const finished = ref(false)

const editor = ctx.editor.getEditor()

const disposable = editor.onDidChangeCursorSelection((e) => {
  if (e.reason === 3) { // Explicitly caused by a user gesture.
    close()
  }
})

function close () {
  image.value = undefined
  emits('dispose')
}

// function onEnter (e: KeyboardEvent) {
//   if (e.isComposing) {
//     return
//   }

//   if (finished.value) {
//     close()
//   } else {
//     process()
//   }
// }

// function onEsc (e: KeyboardEvent) {
//   if (e.isComposing) {
//     return
//   }

//   if (finished.value) {
//     undo()
//   } else {
//     close()
//   }
// }

async function process () {
  finished.value = false
  executeEdit()
  finished.value = true
}

function undo () {
  const editor = ctx.editor.getEditor()
  editor.focus()
  editor.trigger('editor', 'undo', null)
  close()
}

function accept () {
  close()
}

function layout () {
  if (wrapperRef.value) {
    emits('layout', wrapperRef.value.clientHeight + 16)
  }
}

onMounted(() => {
  layout()
  setTimeout(() => {
    layout()
  }, 50)
})

onBeforeUnmount(() => {
  disposable.dispose()
})
</script>

<style lang="scss" scoped>
.widget {
  width: 500px;
  position: relative;
  overflow: hidden;
  padding: 2px;
  border-radius: var(--g-border-radius);
  background: rgba(var(--g-color-85-rgb), 0.8);
  backdrop-filter: var(--g-backdrop-filter);
  margin-top: 8px;

  .close-icon {
    border-radius: 50%;
    padding: 2px;
    position: absolute;
    right: 2px;
    top: 2px;
    width: 16px;
    height: 16px;
    color: var(--g-color-35);

    &:hover {
      background: var(--g-color-75);
      color: var(--g-color-20);
    }
  }

  .content {
    position: relative;
    z-index: 3;
    background: var(--g-color-88);
    color: var(--g-color-10);
    font-size: 14px;
    overflow: hidden;
    padding: 6px;

    h4 {
      margin: 0;
      margin-bottom: 10px;
    }
  }

  .actions {
    display: flex;
    align-items: center;

    button {
      &:first-child {
        margin-left: 0;
      }
    }

    select {
      font-size: 13px;
      padding: 1px;
      width: 120px;
      height: 22px;
    }

    label {
      margin-left: auto;
      margin-right: 4px;
      display: flex;
      align-items: center;
      input {
        margin-right: 4px;
      }
    }
  }
}
</style>
