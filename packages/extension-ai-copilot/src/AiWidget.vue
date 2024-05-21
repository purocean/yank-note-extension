<template>
  <div ref="wrapperRef" :class="{'ai-widget': true, loading}" @mousemove.capture.stop>
    <div class="content">
      <h4 v-if="adapterType === 'edit' && type === 'edit'">{{ $t('ai-edit') }}</h4>
      <h4 v-if="adapterType === 'edit' && type === 'generate'">{{ $t('ai-generate') }}</h4>
      <h4 v-if="adapterType === 'text2image'">{{ $t('ai-text-to-image') }}</h4>
      <svg-icon v-if="!loading" name="times" class="close-icon" @click="close" title="Close" />
      <div class="input" v-if="adapter && adapter.state">
        <textarea
          :placeholder="adapterType === 'edit' ? $t('ask-ai-edit-or-gen') : $t('ask-ai-text2image')"
          ref="textareaRef"
          v-model="adapter.state.instruction"
          v-auto-focus="{delay: 50}"
          rows="1"
          v-auto-resize="{minRows: 1, maxRows: 5}"
          v-textarea-on-enter
          @keydown.arrow-up="(e: any) => e.target.selectionStart === 0 && e.target.selectionEnd === 0 && showHistoryMenu()"
          @mousedown.right="$event.preventDefault(); showHistoryMenu()"
          @keydown.escape="onEsc"
          @keydown.enter="onEnter"
          @keydown.stop
        />
        <svg-icon
          v-if="state.instructionHistory[adapterType]?.length"
          title="History"
          class="input-action-icon"
          name="chevron-down"
          width="13px"
          height="13px"
          @click="showHistoryMenu()"
        />
      </div>
      <img class="img-result" v-if="image && image.src" :src="image.src" />
      <div class="actions" v-if="adapter">
        <button v-if="loading" class="small tr" @click="cancel">{{ $t('cancel') }}</button>
        <button v-else-if="!finished" class="small primary tr" @click="process">{{ type === 'edit' ? $t('rewrite') : $t('generate') }}</button>
        <template v-else>
          <button class="small primary tr" @click="accept">{{ $t('accept') }}</button>
          <button class="small tr" @click="undo">{{ $t('discard') }}</button>
          <button class="small tr" @click="reload"><svg-icon name="sync-alt-solid" width="11px" height="13px" /></button>
        </template>

        <label>
          <template v-if="adapter && adapter.state && adapterType === 'edit'">
            <input type="checkbox" v-model="adapter.state.withContext" />
            {{ $t('with-context') }}
          </template>
        </label>

        <select v-model="state.adapter[adapterType]" @change="textareaRef?.focus()">
          <option v-for="item in adapters" :key="item.id" :value="item.id">{{item.displayname}}</option>
        </select>
      </div>
      <div v-else>{{ $t('no-adapters') }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ctx } from '@yank-note/runtime-api'
import { computed, defineEmits, defineProps, ref, watch, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { i18n, showInstructionHistoryMenu, state, loading, globalCancelTokenSource } from './core'
import { getAdapter, getAllAdapters } from './adapter'
import { executeEdit, executeTextToImage } from './actions'

const SvgIcon = ctx.components.SvgIcon

const { $t } = i18n

const wrapperRef = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const emits = defineEmits<{(event: 'layout', height: number): void, (event: 'dispose'): void}>()
const props = defineProps<{
  type: 'generate' | 'edit',
  adapterType: 'edit' | 'text2image',
  runImmediately: boolean
}>()

const image = shallowRef<{ src: string, blob: Blob }>()

const adapter = computed(() => getAdapter(props.adapterType, state.adapter[props.adapterType]))
const finished = ref(false)

const adapters = computed(() => {
  const adapterId = state.adapter[props.adapterType]
  return adapterId && getAllAdapters(props.adapterType).map(x => ({ id: x.id, displayname: x.displayname }))
})

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
  globalCancelTokenSource.value?.cancel()
  loading.value = false
}

function showHistoryMenu () {
  if (!adapter.value) {
    return
  }

  showInstructionHistoryMenu(props.adapterType, (val, clear) => {
    if (adapter.value) {
      if (clear && val === adapter.value.state.instruction) {
        adapter.value.state.instruction = ''
      } else if (!clear) {
        adapter.value.state.instruction = val
      }

      textareaRef.value?.focus()
    }
  })
}

function setImage (img: typeof image.value) {
  image.value = img
  setTimeout(() => {
    layout()
  }, 50)
}

async function process () {
  if (!adapter.value) {
    return
  }

  const cts = new (ctx.editor.getMonaco().CancellationTokenSource)()
  finished.value = false

  const doAction = props.adapterType === 'edit' ? executeEdit : executeTextToImage

  image.value = undefined
  const res = await doAction(cts.token)

  if (res) {
    finished.value = true
  }

  if (props.adapterType === 'text2image' && res) {
    setImage({
      src: await ctx.utils.fileToBase64URL(res as Blob),
      blob: res as Blob
    })
  }

  textareaRef.value?.focus()
}

function undo () {
  if (props.adapterType === 'text2image') {
    image.value = undefined
    close()
    return
  }

  const editor = ctx.editor.getEditor()
  editor.focus()
  editor.trigger('editor', 'undo', null)
  close()
}

function reload () {
  if (props.adapterType === 'text2image') {
    setImage(undefined)
    process()
    return
  }

  const editor = ctx.editor.getEditor()
  editor.trigger('editor', 'undo', null)
  process()
}

function accept () {
  if (props.adapterType === 'text2image' && image.value) {
    const editor = ctx.editor.getEditor()
    editor.focus()

    const clipboardData = new DataTransfer()
    const file = new File([image.value.blob], 'image.png', { type: image.value.blob.type })
    clipboardData.items.add(file)
    const pasteEvent = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true })
    document.dispatchEvent(pasteEvent)
  }

  close()
}

function layout () {
  if (wrapperRef.value) {
    emits('layout', wrapperRef.value.clientHeight + 16)
  }
}

watch(() => adapter.value?.state?.instruction, async () => {
  layout()
})

watch(() => adapter.value, (val, oldValue) => {
  if (val && oldValue) {
    val.state.instruction = oldValue.state.instruction
  }
}, { flush: 'post' })

onMounted(() => {
  layout()
  setTimeout(() => {
    layout()
    textareaRef.value?.select()
    if (props.runImmediately) {
      process()
    }
  }, 50)
})

onBeforeUnmount(() => {
  cancel()
  disposable.dispose()
})
</script>

<style lang="scss" scoped>
.ai-widget {
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

  .img-result {
    max-width: 50%;
    max-height: 50%;
    margin: 10px 0;
    display: block;
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
