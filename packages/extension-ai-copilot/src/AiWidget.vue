<template>
  <div ref="wrapperRef" :class="{'ai-widget': true, loading}">
    <div class="content">
      <div class="input" v-if="adapter && adapter.state">
        <textarea
          placeholder="Ask Copilot to edit text..."
          ref="textareaRef"
          v-model="adapter.state.instruction"
          v-auto-focus="{delay: 50}"
          rows="1"
          v-auto-resize="{minRows: 1, maxRows: 5}"
          v-textarea-on-enter
          @keydown.escape="onEsc"
          @keydown.enter="onEnter"
          @keydown.stop
        />
        <svg-icon
          v-if="state.instructionHistory?.length"
          title="History"
          class="input-action-icon"
          name="chevron-down"
          width="13px"
          height="13px"
          @click="showHistoryMenu()"
        />
      </div>
      <div class="actions" v-if="adapter">
        <button v-if="loading" class="small tr" @click="cancel">Cancel</button>
        <button v-else-if="!finished" class="small primary tr" @click="process">{{ type === 'edit' ? 'Rewrite' : 'Generate' }}</button>
        <template v-else>
          <button class="small primary tr" @click="close">Accept</button>
          <button class="small tr" @click="undo">Discard</button>
          <button class="small tr" @click="reload"><svg-icon name="sync-alt-solid" width="11px" height="13px" /></button>
        </template>
        <select v-model="state.adapter.edit" @change="textareaRef?.focus()">
          <option v-for="item in adapters" :key="item.id" :value="item.id">{{item.displayname}}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ctx } from '@yank-note/runtime-api'
import { computed, defineEmits, defineProps, ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { showInstructionHistoryMenu, state, loading, globalCancelTokenSource } from './core'
import { getAdapter, getAllAdapters } from './adapter'
import { executeEdit } from './edit'

const SvgIcon = ctx.components.SvgIcon

const wrapperRef = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const emits = defineEmits<{(event: 'layout', height: number): void, (event: 'dispose'): void}>()
defineProps<{type: 'generate' | 'edit'}>()

const adapter = computed(() => getAdapter('edit', state.adapter.edit))
const finished = ref(false)

const adapters = computed(() => {
  return getAllAdapters('edit').map(x => ({ id: x.id, displayname: x.displayname }))
})

const editor = ctx.editor.getEditor()

const disposable = editor.onDidChangeCursorSelection((e) => {
  if (e.reason === 3) { // Explicitly caused by a user gesture.
    close()
  }
})

function close () {
  emits('dispose')
}

function onEnter (e: KeyboardEvent) {
  if (e.isComposing) {
    return
  }

  if (finished.value) {
    close()
  } else {
    process()
  }
}

function onEsc (e: KeyboardEvent) {
  if (e.isComposing) {
    return
  }

  if (finished.value) {
    undo()
  } else if (loading.value) {
    cancel()
  } else {
    close()
  }
}

function cancel () {
  if (loading.value) {
    globalCancelTokenSource.value?.cancel()
  }
}

function showHistoryMenu () {
  if (!adapter.value) {
    return
  }

  showInstructionHistoryMenu((val) => {
    if (adapter.value) {
      adapter.value.state.instruction = val
      textareaRef.value?.focus()
    }
  })
}

async function process () {
  if (!adapter.value) {
    return
  }

  const cts = new (ctx.editor.getMonaco().CancellationTokenSource)()
  finished.value = false

  const doAction = executeEdit

  if (await doAction(cts.token)) {
    finished.value = true
  }

  textareaRef.value?.focus()
}

function undo () {
  const editor = ctx.editor.getEditor()
  editor.focus()
  editor.trigger('editor', 'undo', null)
  close()
}

function reload () {
  const editor = ctx.editor.getEditor()
  editor.trigger('editor', 'undo', null)
  process()
}

function layout () {
  if (wrapperRef.value) {
    emits('layout', wrapperRef.value.clientHeight + 16)
  }
}

watch(() => adapter.value?.state?.instruction, async () => {
  layout()
})

onMounted(() => {
  layout()
  setTimeout(() => {
    layout()
    textareaRef.value?.select()
  }, 50)
})

onBeforeUnmount(() => {
  cancel()
  disposable.dispose()
})
</script>

<style lang="scss" scoped>
.ai-widget {
  width: 400px;
  position: relative;
  overflow: hidden;
  padding: 2px;
  border-radius: var(--g-border-radius);
  background: rgba(var(--g-color-85-rgb), 0.8);
  backdrop-filter: var(--g-backdrop-filter);
  margin-top: 8px;

  .content {
    position: relative;
    z-index: 3;
    background: var(--g-color-88);
    color: var(--g-color-10);
    font-size: 14px;
    overflow: hidden;
    padding: 6px;
  }

  .input {
    position: relative;
    margin-bottom: 8px;

    textarea {
      font-size: 13px;
      padding: 4px;
      resize: none;
      padding-right: 26px;
    }

    .input-action-icon {
      position: absolute;
      right: 10px;
      top: 7px;
      z-index: 1111;
      cursor: pointer;
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
      margin-left: auto;
      font-size: 13px;
      padding: 1px;
      width: 120px;
      height: 22px;
    }
  }

  &.loading::before {
    content: '';
    position: absolute;
    left: -50%;
    top: -350%;
    width: 200%;
    height: 800%;
    background: conic-gradient(transparent, #2196f3, transparent 30%);
    animation: rotate 2s linear infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(1turn);
    }
  }
}
</style>
