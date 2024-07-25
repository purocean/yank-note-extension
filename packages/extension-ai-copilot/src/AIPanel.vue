<template>
  <div ref="panelRef" :class="{ panel: true, pined, loading }" tabindex="-1" @focus="focusEditor">
    <div class="content">
      <div class="head" @mousedown.self="startDrag">
        <svg-icon v-if="state.type === 'completion'" class="logo-icon" :name="AIIcon" @click="doWork" :title="i18n.t('ai-complete') + ' ' + ctx.keybinding.getKeysLabel(COMPLETION_ACTION_NAME)" />
        <svg-icon v-else-if="state.type === 'edit'" class="logo-icon" style="color: #009688" :name="AIIcon" @click="doWork" :title="i18n.t('ai-edit-or-gen') + ' ' + ctx.keybinding.getKeysLabel(EDIT_ACTION_NAME)" />
        <svg-icon v-else class="logo-icon" style="color: #9c27b0" :name="AIIcon" @click="doWork" />
        <b class="title">
          <select v-model="state.adapter[state.type]">
            <option v-for="item in adapters" :key="item.id" :value="item.id">{{item.displayname}}</option>
            <option disabled>---------</option>
            <option value="--new-adapter--">{{ i18n.$t.value('create-custom-adapter') }}</option>
          </select>
          <group-tabs v-if="pined" class="tabs" v-model="state.type" :tabs="tabs" />
        </b>
        <div class="pin-icon" @click="(pined = !pined)">
          <svg-icon style="width: 12px; height: 12px" name="chevron-down" />
        </div>
      </div>
      <div class="setting">
        <div v-if="editAdapter" v-show="state.type === 'edit'">
          <AISettingPanel type="edit" :adapter="editAdapter" :key="state.adapter.edit" />
          <div v-if="editAdapter" class="adapter-desc">
            <span v-html="editAdapter.description" />
            <a v-if="editAdapter.removable" @click.stop.prevent="removeAdapter" class="remove-adapter">{{ i18n.$t.value('remove') }}</a>
          </div>
        </div>
        <div v-if="completionAdapter" v-show="state.type === 'completion'">
          <AISettingPanel type="completion" :adapter="completionAdapter" :key="state.adapter.completion" />
          <div v-if="completionAdapter" class="adapter-desc">
            <span v-html="completionAdapter.description" />
            <a v-if="completionAdapter.removable" @click.stop.prevent="removeAdapter" class="remove-adapter">{{ i18n.$t.value('remove') }}</a>
          </div>
        </div>
        <div v-if="text2imageAdapter" v-show="state.type === 'text2image'">
          <AISettingPanel type="text2image" :adapter="text2imageAdapter" :key="state.adapter.text2image" />
          <div v-if="text2imageAdapter" class="adapter-desc">
            <span v-html="text2imageAdapter.description" />
            <a v-if="text2imageAdapter.removable" @click.stop.prevent="removeAdapter" class="remove-adapter">{{ i18n.$t.value('remove') }}</a>
          </div>
        </div>
        <div v-if="!adapters.length">
          <div class="adapter-desc">
            {{ i18n.$t.value('no-adapters') }}
            <a @click.stop.prevent="createCustomAdapter" class="remove-adapter">{{ i18n.$t.value('create-custom-adapter') }}</a>
          </div>
        </div>
      </div>
      <div class="action" @mousedown.self="startDrag">
        <div class="proxy-input">
          <template v-if="(state.type === 'completion' ? completionAdapter : state.type === 'edit' ? editAdapter : null)?.supportProxy">
            {{ i18n.$t.value('proxy') }}: <input placeholder="eg: http://127.0.0.1:8000" v-model="state.proxy" />
          </template>
        </div>
        <template v-if="!loading">
          <button v-if="state.type === 'completion'" @click="doWork" class="primary tr">{{ i18n.$t.value('completion') }}</button>
          <button v-if="state.type === 'text2image'" @click="doWork" class="primary tr">{{ i18n.$t.value('generate') }}</button>
          <button v-if="state.type === 'edit' && editAdapter" @click="doWork" class="primary tr">
            {{ editAdapter.state.selection ? i18n.$t.value('rewrite') : i18n.$t.value('generate') }}
          </button>
        </template>
        <template v-else>
          <button v-if="state.type !== 'completion'" @click="cancel" class="primary tr">{{ i18n.$t.value('cancel') }}</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, watch, watchEffect, ref, triggerRef, h } from 'vue'
import { ctx } from '@yank-note/runtime-api'
import { i18n, state, loading, COMPLETION_ACTION_NAME, EDIT_ACTION_NAME, globalCancelTokenSource, addCustomAdapters, removeCustomAdapter, TEXT_TO_IMAGE_ACTION_NAME } from './core'
import { getAdapter, getAllAdapters } from './adapter'
import AISettingPanel from './AISettingPanel.vue'

const AIIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path transform="scale(0.95)" transform-origin="center" d="M5.39804 10.8069C5.57428 10.9312 5.78476 10.9977 6.00043 10.9973C6.21633 10.9975 6.42686 10.93 6.60243 10.8043C6.77993 10.6739 6.91464 10.4936 6.98943 10.2863L7.43643 8.91335C7.55086 8.56906 7.74391 8.25615 8.00028 7.99943C8.25665 7.74272 8.56929 7.54924 8.91343 7.43435L10.3044 6.98335C10.4564 6.92899 10.5936 6.84019 10.7055 6.7239C10.8174 6.60762 10.9008 6.467 10.9492 6.31308C10.9977 6.15916 11.0098 5.99611 10.9847 5.83672C10.9596 5.67732 10.8979 5.52591 10.8044 5.39435C10.6703 5.20842 10.4794 5.07118 10.2604 5.00335L8.88543 4.55635C8.54091 4.44212 8.22777 4.24915 7.97087 3.99277C7.71396 3.73638 7.52035 3.42363 7.40543 3.07935L6.95343 1.69135C6.88113 1.48904 6.74761 1.31428 6.57143 1.19135C6.43877 1.09762 6.28607 1.03614 6.12548 1.01179C5.96489 0.987448 5.80083 1.00091 5.64636 1.05111C5.49188 1.1013 5.35125 1.18685 5.23564 1.30095C5.12004 1.41505 5.03265 1.55454 4.98043 1.70835L4.52343 3.10835C4.40884 3.44317 4.21967 3.74758 3.97022 3.9986C3.72076 4.24962 3.41753 4.44067 3.08343 4.55735L1.69243 5.00535C1.54065 5.05974 1.40352 5.14852 1.29177 5.26474C1.18001 5.38095 1.09666 5.52145 1.04824 5.67523C0.999819 5.82902 0.987639 5.99192 1.01265 6.1512C1.03767 6.31048 1.0992 6.46181 1.19243 6.59335C1.32027 6.7728 1.50105 6.90777 1.70943 6.97935L3.08343 7.42435C3.52354 7.57083 3.90999 7.84518 4.19343 8.21235C4.35585 8.42298 4.4813 8.65968 4.56443 8.91235L5.01643 10.3033C5.08846 10.5066 5.22179 10.6826 5.39804 10.8069ZM5.48343 3.39235L6.01043 2.01535L6.44943 3.39235C6.61312 3.8855 6.88991 4.33351 7.25767 4.70058C7.62544 5.06765 8.07397 5.34359 8.56743 5.50635L9.97343 6.03535L8.59143 6.48335C8.09866 6.64764 7.65095 6.92451 7.28382 7.29198C6.9167 7.65945 6.64026 8.10742 6.47643 8.60035L5.95343 9.97835L5.50443 8.59935C5.34335 8.10608 5.06943 7.65718 4.70443 7.28835C4.3356 6.92031 3.88653 6.64272 3.39243 6.47735L2.01443 5.95535L3.40043 5.50535C3.88672 5.33672 4.32775 5.05855 4.68943 4.69235C5.04901 4.32464 5.32049 3.88016 5.48343 3.39235ZM11.5353 14.8494C11.6713 14.9456 11.8337 14.9973 12.0003 14.9974C12.1654 14.9974 12.3264 14.9464 12.4613 14.8514C12.6008 14.7529 12.7058 14.6129 12.7613 14.4514L13.0093 13.6894C13.0625 13.5309 13.1515 13.3869 13.2693 13.2684C13.3867 13.1498 13.5307 13.0611 13.6893 13.0094L14.4613 12.7574C14.619 12.7029 14.7557 12.6004 14.8523 12.4644C14.9257 12.3614 14.9736 12.2424 14.9921 12.1173C15.0106 11.9922 14.9992 11.8645 14.9588 11.7447C14.9184 11.6249 14.8501 11.5163 14.7597 11.428C14.6692 11.3396 14.5591 11.2739 14.4383 11.2364L13.6743 10.9874C13.5162 10.9348 13.3724 10.8462 13.2544 10.7285C13.1364 10.6109 13.0473 10.4674 12.9943 10.3094L12.7423 9.53638C12.6886 9.37853 12.586 9.24191 12.4493 9.14638C12.3473 9.07343 12.2295 9.02549 12.1056 9.00642C11.9816 8.98736 11.8549 8.99772 11.7357 9.03665C11.6164 9.07558 11.508 9.142 11.4192 9.23054C11.3304 9.31909 11.2636 9.42727 11.2243 9.54638L10.9773 10.3084C10.925 10.466 10.8375 10.6097 10.7213 10.7284C10.6066 10.8449 10.4667 10.9335 10.3123 10.9874L9.53931 11.2394C9.38025 11.2933 9.2422 11.3959 9.1447 11.5326C9.04721 11.6694 8.99522 11.8333 8.99611 12.0013C8.99699 12.1692 9.0507 12.3326 9.14963 12.4683C9.24856 12.604 9.38769 12.7051 9.54731 12.7574L10.3103 13.0044C10.4692 13.0578 10.6136 13.1471 10.7323 13.2654C10.8505 13.3836 10.939 13.5283 10.9903 13.6874L11.2433 14.4614C11.2981 14.6178 11.4001 14.7534 11.5353 14.8494ZM10.6223 12.0564L10.4433 11.9974L10.6273 11.9334C10.9291 11.8284 11.2027 11.6556 11.4273 11.4284C11.6537 11.1994 11.8248 10.9216 11.9273 10.6164L11.9853 10.4384L12.0443 10.6194C12.1463 10.9261 12.3185 11.2047 12.5471 11.4332C12.7757 11.6617 13.0545 11.8336 13.3613 11.9354L13.5563 11.9984L13.3763 12.0574C13.0689 12.1596 12.7898 12.3322 12.5611 12.5616C12.3324 12.791 12.1606 13.0707 12.0593 13.3784L12.0003 13.5594L11.9423 13.3784C11.8409 13.0702 11.6687 12.7901 11.4394 12.5605C11.2102 12.3309 10.9303 12.1583 10.6223 12.0564Z"/></svg>'
const editor = ctx.editor.getEditor()

const tabs: { label: string, value: typeof state.type }[] = [
  { label: i18n.t('completion'), value: 'completion' },
  // { label: 'Chat', value: 'chat' },
  { label: i18n.t('rewrite-or-generate'), value: 'edit' },
  { label: i18n.t('text-to-image'), value: 'text2image' }
]

const { SvgIcon, GroupTabs } = ctx.components

const pined = computed({
  get () {
    return !!state.aiPanelPined
  },
  set (val) {
    state.aiPanelPined = val
  }
})

const adapters = computed(() => {
  return (pined.value || true) && getAllAdapters(state.type).map(x => ({ id: x.id, displayname: x.displayname }))
})

const completionAdapter = computed(() => getAdapter('completion', state.adapter.completion))
const editAdapter = computed(() => getAdapter('edit', state.adapter.edit))
const text2imageAdapter = computed(() => getAdapter('text2image', state.adapter.text2image))

function focusEditor () {
  nextTick(() => {
    editor.focus()
  })
}

function doWork () {
  if (state.type === 'completion') {
    ctx.action.getActionHandler(COMPLETION_ACTION_NAME)()
  } else if (state.type === 'edit') {
    ctx.action.getActionHandler(EDIT_ACTION_NAME)(pined.value)
  } else if (state.type === 'text2image') {
    ctx.action.getActionHandler(TEXT_TO_IMAGE_ACTION_NAME)(pined.value)
  }
}

function cancel () {
  globalCancelTokenSource.value?.cancel()
}

function escHandler (e: KeyboardEvent) {
  if (e.key === 'Escape') {
    pined.value = false
  }
}

function resetPanelContainer () {
  panelContainer.value!.style.position = 'absolute'
  panelContainer.value!.style.left = '91%'
  panelContainer.value!.style.top = ''
  panelContainer.value!.style.right = ''
  panelContainer.value!.style.bottom = '20px'
}

async function createCustomAdapter () {
  if (!ctx.api.proxyFetch) {
    ctx.ui.useToast().show('warning', 'Please use the latest version of Yank Note to use this feature')
    return
  }

  const adapterPreset = ref<'openai' | 'custom'>(state.type === 'text2image' ? 'custom' : 'openai')

  type AdapterParamsName = 'ollama' | 'kimi' | 'dashscope' | 'openai' | 'custom'

  const adapterParamsName = ref<AdapterParamsName>('ollama')

  const adapterOpenAIPresets = {
    ollama: {
      displayName: 'Ollama',
      params: { model: 'llama3.1', endpoint: 'http://127.0.0.1:11434/v1/chat/completions' },
    },
    kimi: {
      displayName: 'Kimi',
      params: { model: 'moonshot-v1-8k', endpoint: 'https://api.moonshot.cn/v1/chat/completions' },
    },
    dashscope: {
      displayName: '阿里云-灵积',
      params: { model: 'qwen-turbo', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' },
    },
    openai: {
      displayName: 'OpenAI',
      params: { model: 'gpt-3.5-turbo', endpoint: 'https://api.openai.com/v1/chat/completions' },
    },
    custom: {
      displayName: i18n.t('custom'),
      params: { model: '', endpoint: '' },
    },
  }

  const name = await ctx.ui.useModal().input({
    title: i18n.t('create-custom-adapter'),
    hint: i18n.t('adapter-name'),
    value: state.type === 'text2image' ? 'Workers AI' : 'Adapter',
    modalWidth: '500px',
    maxlength: 32,
    component: state.type === 'text2image'
      ? undefined
      : h('div', { style: 'margin-top: 16px' }, [
        h('div', { style: 'margin: 8px 0' }, [
          i18n.t('custom-adapter-type'),
          h('label', { style: 'margin-left: 8px' }, [h('input', { type: 'radio', name: 'type', value: 'openai', checked: adapterPreset.value === 'openai', onChange: () => { adapterPreset.value = 'openai' } }), ' ' + i18n.t('openai-compatible')]),
          h('label', { style: 'margin: 0 8px' }, [h('input', { type: 'radio', name: 'type', value: 'custom', checked: adapterPreset.value === 'custom', onChange: () => { adapterPreset.value = 'custom' } }), ' ' + i18n.t('custom') + '-Workers AI']),
        ]),
        h('div', { style: 'margin: 8px 0' }, [
          i18n.t('custom-adapter-params'),
          h(
            'select',
            { style: 'margin-left: 8px', value: adapterParamsName.value, onChange: e => { adapterParamsName.value = e.target.value as AdapterParamsName } },
            Object.entries(adapterOpenAIPresets).map(([key, { displayName }]) => h('option', { value: key }, displayName))
          ),
        ]),
      ]),

    select: true,
  })

  if (!name) return

  if (adapters.value.some(x => x.id === name || x.displayname === name)) {
    ctx.ui.useToast().show('warning', i18n.t('adapter-name-exists'))
    return
  }

  addCustomAdapters(
    { name, type: state.type, preset: adapterPreset.value },
    adapterOpenAIPresets[adapterParamsName.value || 'custom'].params,
  )
  triggerRef(pined)
  setTimeout(() => {
    state.adapter[state.type] = name
  }, 0)
}

async function removeAdapter () {
  const adapter = state.adapter[state.type]
  if (!adapter) return

  const res = await ctx.ui.useModal().confirm({
    title: i18n.t('remove-adapter'),
    content: i18n.t('remove-adapter-confirm', adapter),
  })

  if (res) {
    const stateKey = state.type + '-' + adapter
    removeCustomAdapter({ type: state.type, name: adapter })
    triggerRef(pined)
    setTimeout(() => {
      state.adapter[state.type] = adapters.value[0]?.id
      delete state.adapterState[stateKey]
    }, 0)
  }
}

ctx.registerHook('GLOBAL_KEYDOWN', escHandler)

onMounted(() => {
  setTimeout(() => {
    if (typeof state.aiPanelPined === 'undefined') {
      pined.value = true
    }

    if (!completionAdapter.value && state.type === 'completion') {
      state.adapter[state.type] = adapters.value[0]?.id
    }

    if (!editAdapter.value && state.type === 'edit') {
      state.adapter[state.type] = adapters.value[0]?.id
    }

    if (!text2imageAdapter.value && state.type === 'text2image') {
      state.adapter[state.type] = adapters.value[0]?.id
    }
  }, 0)

  resetPanelContainer()
})

onBeforeUnmount(() => {
  ctx.removeHook('GLOBAL_KEYDOWN', escHandler)
  resetPanelContainer()
})

const panelRef = ref<HTMLElement>()
const panelContainer = computed(() => panelRef.value?.parentElement)

let isDragging = false
let startMouseX = 0
let startMouseY = 0
let startX = 0
let startY = 0

const startDrag = (event: MouseEvent) => {
  if (!pined.value) return
  isDragging = true
  const rect = panelContainer.value!.getBoundingClientRect()
  startX = rect.left
  startY = rect.top
  startMouseX = event.clientX
  startMouseY = event.clientY
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const setPanelContainerPosition = (x: number, y: number) => {
  const rect = panelContainer.value!.getBoundingClientRect()
  const newX = Math.min(Math.max(x, 0), window.innerWidth - rect.width)
  const newY = Math.min(Math.max(y, 0), window.innerHeight - rect.height - 30)
  panelContainer.value!.style.position = 'fixed'
  panelContainer.value!.style.left = `${newX}px`
  panelContainer.value!.style.top = `${newY}px`
  panelContainer.value!.style.right = 'unset'
  panelContainer.value!.style.bottom = 'unset'
}

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging) return
  if (!pined.value) return
  const offsetX = event.clientX - startMouseX
  const offsetY = event.clientY - startMouseY
  setPanelContainerPosition(startX + offsetX, startY + offsetY)
}

const refreshPanelSize = async () => {
  if (pined.value) {
    // wait for panel animation
    await ctx.utils.sleep(130)
    const rect = panelContainer.value!.getBoundingClientRect()
    if (rect.left > window.innerWidth - rect.width || rect.top > window.innerHeight - rect.height + 30) {
      setPanelContainerPosition(rect.left, rect.top)
    }
  } else {
    resetPanelContainer()
  }
}

watchEffect(refreshPanelSize, { flush: 'post' })
watch(editAdapter, () => {
  refreshPanelSize()
  cancel()
})

watch(() => state.adapter[state.type], (val, oldVal) => {
  if (val === '--new-adapter--') {
    state.adapter[state.type] = oldVal
    createCustomAdapter()
  }
})

const onMouseUp = () => {
  isDragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}
</script>

<style lang="scss" scoped>
.panel {
  background: rgba(var(--g-color-85-rgb), 0.8);
  backdrop-filter: var(--g-backdrop-filter);
  color: var(--g-color-10);
  font-size: 14px;
  overflow: hidden;
  transition: .1s ease-in-out;
  border-radius: 16px;
  box-shadow: rgba(0, 0, 0, 0.3) 1px 1px 2px;
  width: 32px;
  height: fit-content;
  min-height: 32px;
  max-height: 32px;
  box-sizing: border-box;
  position: relative;

  .content {
    z-index: 3;
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    min-height: 32px;
    transition: .1s ease-in-out;
    padding: 2px;
    box-sizing: border-box;
  }

  .head {
    display: flex;
    flex-direction: column-reverse;
    justify-content: flex-start;
    align-items: center;
    position: absolute;
    bottom: 2px;

    .tabs {
      display: inline-flex;
      margin-bottom: 0;
      z-index: 1;
      flex: none;
      margin-left: 6px;
      background: var(--g-color-86);

      ::v-deep(.tab) {
        font-weight: normal;
        line-height: 1.5;
        font-size: 12px;
      }
    }

    .logo-icon {
      color: rgb(250, 148, 37);
      width: 24px;
      height: 24px;
      margin: 2px;
      transition: .1s ease-in-out;
      flex: none;
      cursor: pointer;
    }

    .title {
      opacity: 0;
      display: none;
      margin-right: auto;
      margin-left: 2px;

      select {
        font-size: 12px;
        padding: 1px;
        width: 120px;
        height: 20px;
        background: var(--g-color-80);
      }
    }

    .pin-icon {
      width: 20px;
      height: 20px;
      overflow: hidden;
      transition: left .1s;
      display: none;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: var(--g-color-20);
      transform: rotate(180deg);
      transition: transform .2s;
      opacity: 0;

      &:hover {
        background: var(--g-color-75);
      }
    }
  }

  .setting {
    display: none;
    padding: 8px 0;
  }

  .action {
    display: none;
    justify-content: space-between;
    align-items: center;
    height: 36px;
    position: sticky;
    bottom: 0;
    background: var(--g-color-85);
    border-top: 1px solid var(--g-color-70);
    margin: 0;
    padding: 0 14px;
  }

  &.pined .pin-icon {
    display: flex;
    transform: rotate(0);
  }

  &.pined {
    max-height: 80vh;
    width: 530px;

    .head {
      border-bottom: 1px solid var(--g-color-70);
      padding: 4px;
      justify-content: space-between;
      flex-direction: row;
      position: relative;

      .logo-icon {
        width: 18px;
        height: 18px;
        cursor: default;
        pointer-events: none;
      }

      .title {
        opacity: 1;
        display: block;
      }

      .pin-icon {
        opacity: 1;
      }
    }

    .setting {
      display: block;
      overflow-y: auto;
      max-height: calc(80vh - 100px);

      .adapter-desc {
        margin-top: 12px;
        font-size: 12px;
        text-align: center;
        color: var(--g-color-30);
        ::v-deep(a) {
          color: var(--g-color-30);
        }
      }
    }

    .action {
      display: flex;
    }
  }

  &:hover:not(.pined) {
    min-height: 60px;

    .head {
      .title {
        display: none;
      }

      // .logo-icon {
      //   width: 18px;
      //   height: 18px;
      // }

      .pin-icon {
        opacity: 1;
        margin: 4px;
        display: flex;
      }
    }

    .content {
      min-height: 60px;
    }
  }

  &.pined, &:hover {
    box-shadow: rgba(0, 0, 0, 0.3) 2px 2px 10px;
    border-radius: var(--g-border-radius);

    &::after {
      border-radius: var(--g-border-radius);
    }
  }

  .proxy-input {
    display: flex;
    font-size: 13px;
    align-items: center;
    white-space: nowrap;

    input {
      font-size: 13px;
      padding: 4px;
      width: 100%;
      background: var(--g-color-80);
      height: 24px;
      margin-left: 3px;
    }
  }

  .remove-adapter {
    text-decoration: underline;
    margin-left: 0.5em;
    cursor: pointer;
  }

  &::after {
    content: '';
    position: absolute;
    left: 2px;
    top: 2px;
    width: calc(100% - 4px);
    height: calc(100% - 4px);
    background: rgba(var(--g-color-85-rgb), 1);
    border-radius: 16px;
    z-index: 1;
  }

  &.loading::before {
    content: '';
    position: absolute;
    left: -50%;
    top: -50%;
    width: 200%;
    height: 200%;
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
