<template>
  <template v-if="panel">
    <component v-if="panel.type === 'custom'" :is="panel.component"/>
    <template v-else-if="panel.type === 'form'">
      <template v-for="item in unref(panel.items)" :key="item.key">
        <component v-if="item.type === 'custom'" :is="item.component"/>
        <div v-else-if="adapterState" :class="{
          row : true,
          'has-icon-btn': !!(item as any).defaultValue || item.key === 'instruction',
          'has-error': !!item.hasError?.(adapterState[item.key])
        }">
          <div class="label"> {{ item.label }} </div>
            <div v-if="item.type === 'context'">
              <template v-if="type !== 'edit' || adapterState.withContext">
                <textarea v-model="adapterState.context" v-bind="item.props" :placeholder="i18n.$t.value('no-context-available')" />
                <div class="input">
                  <input style="outline: none" type="range" max="8000" min="0" v-model.number="(adapterState as any)._contextLength" />
                  <input style="outline: none" type="number" max="8000" min="0" v-model.number="(adapterState as any)._contextLength" />
                </div>
              </template>
              <label v-if="type === 'edit'" style="display: flex; align-items: center;">
                <input type="checkbox" v-model="adapterState.withContext" style="width: fit-content; margin-right: 4px;" />
                {{ i18n.$t.value('with-context') }}
              </label>
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
                v-if="item.key === 'instruction'"
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
import { computed, unref, defineProps, watchEffect, onBeforeUnmount, watch, onMounted } from 'vue'
import { CURSOR_PLACEHOLDER, i18n, showInstructionHistoryMenu, state } from './core'
import { ctx } from '@yank-note/runtime-api'
import { Adapter, AdapterType, FormItem } from './adapter'

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

const adapterRes = adapter.value.activate()
const adapterState = adapterRes.state

if (adapterState) {
  adapterState._contextLength = props.type === 'completion' ? 256 : 0
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
  const contentPrefix = model.getValueInRange(new monaco.Range(
    1,
    1,
    position.lineNumber,
    position.column,
  ))

  const maxLine = model.getLineCount()
  const maxColumn = model.getLineMaxColumn(maxLine)

  const contentSuffix = model.getValueInRange(new monaco.Range(
    position.lineNumber,
    position.column,
    maxLine,
    maxColumn,
  ))

  const selection = editor.getSelection()
  if (selection) {
    const selectedText = model.getValueInRange(selection)
    adapterState.selection = selectedText
  } else {
    adapterState.selection = ''
  }

  const contextMaxLength = adapterState._contextLength
  const contextRadius = Math.floor(contextMaxLength / 2)

  let context: string

  if (contextRadius < 1) {
    context = ''
  } else if (contentPrefix.length > contextRadius && contentSuffix.length > contextRadius) {
    context = contentPrefix.slice(-contextRadius) + CURSOR_PLACEHOLDER + contentSuffix.slice(0, contextRadius)
  } else if (contentPrefix.length > contextRadius) {
    context = contentPrefix.slice(-(contextMaxLength - contentSuffix.length)) + CURSOR_PLACEHOLDER + contentSuffix
  } else if (contentSuffix.length > contextRadius) {
    context = contentPrefix + CURSOR_PLACEHOLDER + contentSuffix.slice(0, contextMaxLength - contentPrefix.length)
  } else {
    context = contentPrefix + CURSOR_PLACEHOLDER + contentSuffix
  }

  adapterState.context = context
}

function showHistoryMenu (item: FormItem) {
  if (item.type === 'custom') {
    return
  }

  showInstructionHistoryMenu(state.type, (val, clear) => {
    if (clear && val === adapterState[item.key]) {
      adapterState[item.key] = ''
    } else if (!clear) {
      adapterState![item.key] = val
    }
  })
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
  state.adapterState[adapterKey.value] = ctx.lib.lodash.omit(adapterState, 'context', 'selection')
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
