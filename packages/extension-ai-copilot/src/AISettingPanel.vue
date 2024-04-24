<template>
  <template v-if="panel">
    <component v-if="panel.type === 'custom'" :is="panel.component"/>
    <template v-else-if="panel.type === 'form'">
      <template v-for="item in unref(panel.items)" :key="item.key">
        <component v-if="item.type === 'custom'" :is="item.component"/>
        <div v-else-if="adapterState" :class="{
          row : true,
          'has-icon-btn': !!(item as any).defaultValue || (item as any).historyValueKey,
          'has-error': !!item.hasError?.(adapterState[item.key])
        }">
          <div class="label">{{ item.label }}</div>
            <div v-if="item.type === 'prefix'">
              <textarea ref="prefixContextRef" v-model="adapterState.prefix" v-bind="item.props" />
              <div class="input">
                <input type="range" max="4000" min="1" v-model.number="(adapterState as any)._prefixLength" />
                <input type="number" max="4000" min="1" v-model.number="(adapterState as any)._prefixLength" />
              </div>
            </div>
            <div v-else-if="item.type === 'suffix'">
              <textarea ref="suffixContextRef" v-model="adapterState.suffix" v-bind="item.props" />
              <div class="input">
                <input type="range" max="4000" min="0" v-model.number="(adapterState as any)._suffixLength" />
                <input type="number" max="4000" min="0" v-model.number="(adapterState as any)._suffixLength" />
              </div>
            </div>
            <div v-else-if="item.type === 'selection'">
              <textarea v-model="adapterState.selection" v-bind="item.props" />
            </div>
            <div v-else style="position: relative">
              <div class="input" :title="(item as any).description">
                <input v-if="item.type === 'input'" type="text" v-model="adapterState[item.key]" v-bind="item.props" />
                <textarea v-if="item.type === 'textarea' || item.type === 'instruction'" v-model="adapterState[item.key]" v-bind="item.props" />
                <select v-else-if="item.type === 'select'" v-model="adapterState[item.key]" v-bind="item.props">
                  <option v-for="option in item.options" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <template v-else-if="item.type === 'range'">
                  <input type="range" :max="item.max" :min="item.min" :step="item.step" v-model.number="adapterState[item.key]" v-bind="item.props" />
                  <input type="number" :max="item.max" :min="item.min" :step="item.step" v-model.number="adapterState[item.key]" v-bind="item.props" />
                </template>
              </div>
              <svg-icon
                v-if="(item as any).historyValueKey && adapterState[(item as any).historyValueKey]?.length"
                title="History"
                class="input-action-icon"
                name="chevron-down"
                width="13px"
                height="13px"
                @click="showHistoryMenu(item)"
              />
              <svg-icon
                v-else-if="item.defaultValue"
                title="Reset to default"
                class="input-action-icon"
                name="sync-alt-solid"
                width="13px"
                height="13px"
                @click="adapterState[item.key] = item.defaultValue"
              />
            </div>
        </div>
      </template>
    </template>
  </template>
  <div v-else class="adapter-info">
    {{ adapter.displayname }}
    <div class="desc">{{ adapter.description }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed, unref, defineProps, ref, nextTick, watchEffect, onBeforeUnmount, watch, onMounted } from 'vue'
import { state } from './core'
import { ctx } from '@yank-note/runtime-api'
import { Adapter, AdapterType, FormItem } from './adapter'
import type { Components } from '../../api/types/types/renderer/types'

const SvgIcon = ctx.components.SvgIcon

const editor = ctx.editor.getEditor()
const monaco = ctx.editor.getMonaco()

const props = defineProps<{
  adapter: Adapter
  type: AdapterType
}>()

const adapterKey = computed(() => props.type + '-' + state.adapter[props.type])

const adapter = computed(() => props.adapter)
const panel = computed(() => unref(adapter.value.panel))

const suffixContextRef = ref<HTMLElement[] | HTMLElement | null>(null)
const prefixContextRef = ref<HTMLElement[] | HTMLElement | null>(null)

const adapterRes = adapter.value.activate()
const adapterState = adapterRes.state

if (adapterState) {
  adapterState._prefixLength = 128
  adapterState._suffixLength = 128
  Object.keys(state.adapterState[adapterKey.value] || {}).forEach(key => {
    adapterState[key] = state.adapterState[adapterKey.value][key]
  })
}

function buildContent () {
  if (!adapterState) {
    return
  }

  const model = editor.getModel()!
  const position = editor.getPosition()!
  let contentPrefix = model.getValueInRange(new monaco.Range(
    1,
    1,
    position.lineNumber,
    position.column,
  ))

  const maxLine = model.getLineCount()
  const maxColumn = model.getLineMaxColumn(maxLine)

  let contentSuffix = model.getValueInRange(new monaco.Range(
    position.lineNumber,
    position.column,
    maxLine,
    maxColumn,
  ))

  const selection = editor.getSelection()
  let useSelection = false
  if (selection) {
    const selectedText = model.getValueInRange(selection)
    if (selectedText) {
      contentPrefix = selectedText
      contentSuffix = ''
      useSelection = true
    }

    adapterState.selection = selectedText
  } else {
    adapterState.selection = ''
  }

  const prefix = contentPrefix.slice(useSelection ? 0 : -adapterState._prefixLength)
  const suffix = contentSuffix.slice(0, adapterState._suffixLength)

  adapterState.prefix = prefix
  adapterState.suffix = suffix

  function toArray<T> (obj?: T | T[] | null) {
    return obj
      ? (Array.isArray(obj) ? obj : [obj])
      : []
  }

  nextTick(() => {
    toArray(suffixContextRef.value).forEach(x => x.scrollTo(0, 0))
    toArray(prefixContextRef.value).forEach(x => x.scrollTo(0, x.scrollHeight))
  })
}

function showHistoryMenu (item: FormItem) {
  if (item.type === 'custom') {
    return
  }

  const list: string[] = adapterState![(item as any).historyValueKey!]
  const items: Components.ContextMenu.Item[] = list.map(x => ({
    id: x,
    label: x.slice(0, 20) + (x.length > 20 ? '...' : ''),
    onClick: () => {
      adapterState![item.key] = x
    }
  }))

  ctx.ui.useContextMenu().show(items.concat(
    { type: 'separator' },
    {
      id: 'clear',
      label: 'Clear',
      onClick: () => {
        adapterState![(item as any).historyValueKey!] = []
      }
    })
  )
}

watchEffect(buildContent)
onMounted(buildContent)
watch(() => ctx.store.state.currentContent, ctx.lib.lodash.debounce(buildContent, 200))

const dispose = [
  editor.onDidChangeCursorPosition(buildContent),
  adapterRes
]

onBeforeUnmount(() => {
  dispose.forEach(x => x.dispose())
})

watchEffect(() => {
  state.adapterState[adapterKey.value] = ctx.lib.lodash.omit(adapterState, 'suffix', 'prefix', 'selection')
}, { flush: 'post' })
</script>

<style lang="scss" scoped>
.row {
  margin: 5px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-top: 1px var(--g-color-80) solid;
  padding-top: 4px;

  &.has-icon-btn {
    input[type=text], input[type=password], textarea {
      padding-right: 26px;
    }
  }

  &.has-error{
    input, textarea {
      outline: 1px solid red;
      outline-offset: -2px;
    }
  }

  &:first-child {
    border-top: none;
    padding-top: 0;
  }

  .label {
    margin-bottom: 4px;
    margin-right: 8px;
    flex: none;
    width: 80px;
    font-size: 13px;
    line-height: 1.1;

    & + div {
      width: 100%;
      overflow: hidden;
    }
  }

  .input {
    display: flex;
    justify-content: space-between;
  }

  input, select {
    width: 100%;
  }

  select,
  input[type=text],
  input[type=password],
  input[type=number] {
    font-size: 13px;
    padding: 4px;
  }

  input[type=number] {
    width: 60px;
    flex: none;
    margin-left: 10px;
  }

  textarea {
    height: 5em;
    font-size: 13px;
    resize: none;
    margin-bottom: 4px;
  }

  .input-action-icon {
    position: absolute;
    right: 10px;
    top: 7px;
    z-index: 1111;
    cursor: pointer;
  }
}

.adapter-info {
  text-align: center;
  font-weight: bold;
  margin-top: 30px;
  margin-bottom: 20px;
  font-size: 24px;

  .desc {
    font-size: 14px;
    margin-top: 10px;
    color: #666;
    font-weight: normal;
  }
}
</style>
