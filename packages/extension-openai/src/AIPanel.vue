<template>
  <div :class="{ panel: true, pined, loading }">
    <div class="content">
      <div class="head">
        <svg-icon class="logo-icon" :name="openAIIcon" @click="submit" :title="i18n.t('openai-complete') + ' ' + ctx.command.getKeysLabel(actionName)" />
        <b class="title">OpenAI</b>
        <div class="pin-icon" @click="(pined = !pined)">
          <svg-icon style="width: 12px; height: 12px" name="chevron-down" />
        </div>
      </div>
      <div class="setting">
        <div class="row">
          <div class="label">Prefix</div>
          <div>
            <textarea ref="prefixContextRef" class="context" v-model="setting.prefix" />
            <div class="input">
              <input type="range" max="4000" min="1" v-model.number="setting.prefixLength" />
              <input type="number" max="4000" min="1" v-model.number="setting.prefixLength" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="label">Suffix</div>
          <div>
            <textarea ref="suffixContextRef" class="context" v-model="setting.suffix" />
            <div class="input">
              <input type="range" max="4000" min="0" v-model.number="setting.suffixLength" />
              <input type="number" max="4000" min="0" v-model.number="setting.suffixLength" />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="label">Model</div>
          <select v-model="setting.model">
            <option v-for="model in models" :key="model" :value="model">{{model}}</option>
          </select>
        </div>
        <div class="row">
          <div class="label">Max tokens</div>
          <div class="input">
            <input type="range" max="4096" min="1" v-model.number="setting.maxTokens" />
            <input type="number" max="4096" min="1" v-model.number="setting.maxTokens" />
          </div>
        </div>
        <div class="row">
          <div class="label">Temperature</div>
          <div class="input">
            <input type="range" max="1" min="0" step="0.01" v-model.number="setting.temperature" />
            <input type="number" max="1" min="0" step="0.01" v-model.number="setting.temperature" />
          </div>
        </div>
        <div class="row">
          <div class="label">Top P</div>
          <div class="input">
            <input type="range" max="1" min="0" step="0.01" v-model.number="setting.topP" />
            <input type="number" max="1" min="0" step="0.01" v-model.number="setting.topP" />
          </div>
        </div>
        <div class="row">
          <div class="label">Frequency penalty</div>
          <div class="input">
            <input type="range" max="2" min="0" step="0.01" v-model.number="setting.frequencyPenalty" />
            <input type="number" max="2" min="0" step="0.01" v-model.number="setting.frequencyPenalty" />
          </div>
        </div>
        <div class="row">
          <div class="label">Presence penalty</div>
          <div class="input">
            <input type="range" max="2" min="0" step="0.01" v-model.number="setting.presencePenalty" />
            <input type="number" max="2" min="0" step="0.01" v-model.number="setting.presencePenalty" />
          </div>
        </div>
        <div class="row">
          <div class="label">Stop sequences</div>
          <input type="text" placeholder='string or json array. e.g. hello or ["\n"]' v-model="setting.stopSequences" />
        </div>
        <div class="row">
          <a href="https://beta.openai.com/docs/introduction/overview" target="_blank">OpenAI API</a>
          <button @click="submit" class="primary tr">Submit</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref, watch, watchEffect } from 'vue'
import { ctx } from '@yank-note/runtime-api'
import { i18n, models, setting, loading, actionName } from './openai'

const openAIIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51 51"><path fill="currentColor" transform="scale(0.89)" transform-origin="center" d="M47.21,20.92a12.65,12.65,0,0,0-1.09-10.38A12.78,12.78,0,0,0,32.36,4.41,12.82,12.82,0,0,0,10.64,9a12.65,12.65,0,0,0-8.45,6.13,12.78,12.78,0,0,0,1.57,15A12.64,12.64,0,0,0,4.84,40.51a12.79,12.79,0,0,0,13.77,6.13,12.65,12.65,0,0,0,9.53,4.25A12.8,12.8,0,0,0,40.34,42a12.66,12.66,0,0,0,8.45-6.13A12.8,12.8,0,0,0,47.21,20.92ZM28.14,47.57a9.46,9.46,0,0,1-6.08-2.2l.3-.17,10.1-5.83a1.68,1.68,0,0,0,.83-1.44V23.69l4.27,2.47a.15.15,0,0,1,.08.11v11.8A9.52,9.52,0,0,1,28.14,47.57ZM7.72,38.85a9.45,9.45,0,0,1-1.13-6.37l.3.18L17,38.49a1.63,1.63,0,0,0,1.65,0L31,31.37V36.3a.17.17,0,0,1-.07.13L20.7,42.33A9.51,9.51,0,0,1,7.72,38.85Zm-2.66-22a9.48,9.48,0,0,1,5-4.17v12a1.62,1.62,0,0,0,.82,1.43L23.17,33.2,18.9,35.67a.16.16,0,0,1-.15,0L8.54,29.78A9.52,9.52,0,0,1,5.06,16.8ZM40.14,25,27.81,17.84l4.26-2.46a.16.16,0,0,1,.15,0l10.21,5.9A9.5,9.5,0,0,1,41,38.41v-12A1.67,1.67,0,0,0,40.14,25Zm4.25-6.39-.3-.18L34,12.55a1.64,1.64,0,0,0-1.66,0L20,19.67V14.74a.14.14,0,0,1,.06-.13L30.27,8.72a9.51,9.51,0,0,1,14.12,9.85ZM17.67,27.35,13.4,24.89a.17.17,0,0,1-.08-.12V13a9.51,9.51,0,0,1,15.59-7.3l-.3.17-10.1,5.83a1.68,1.68,0,0,0-.83,1.44Zm2.32-5,5.5-3.17L31,22.35v6.34l-5.49,3.17L20,28.69Z"></path></svg>'
const editor = ctx.editor.getEditor()
const monaco = ctx.editor.getMonaco()

const { SvgIcon } = ctx.components

const suffixContextRef = ref<HTMLElement | null>(null)
const prefixContextRef = ref<HTMLElement | null>(null)
const pined = ref(false)

function buildContent () {
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

  const prefix = contentPrefix.slice(-setting.prefixLength)
  const suffix = contentSuffix.slice(0, setting.suffixLength)

  setting.prefix = prefix
  setting.suffix = suffix

  nextTick(() => {
    prefixContextRef.value?.scrollTo(0, 0)
    suffixContextRef.value?.scrollTo(0, suffixContextRef.value.scrollHeight)
  })
}

function submit () {
  ctx.action.getActionHandler(actionName)()
}

watchEffect(buildContent)

watch(pined, buildContent)
watch(() => ctx.store.state.currentContent, ctx.lib.lodash.debounce(buildContent, 200))

const dispose = editor.onDidChangeCursorPosition(buildContent)

onBeforeUnmount(dispose.dispose)
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
    padding: 8px 14px;

    .context {
      height: 6em;
      font-size: 12px;
      overflow-y: auto;
      overflow-wrap: break-word;
      white-space: pre-wrap;
      margin-bottom: 4px;
      resize: none;
    }

    .row {
      margin: 8px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .label {
        margin-bottom: 4px;
        margin-right: 8px;
        flex: none;
        width: 80px;

        & + div {
          width: 100%;
          overflow: hidden;
        }
      }

      .input {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }

      input, select {
        width: 100%;
      }

      select,
      input[type=text],
      input[type=number] {
        font-size: 14px;
        padding: 4px;
      }

      input[type=number] {
        width: 60px;
        flex: none;
        margin-left: 10px;
      }
    }
  }

  &.pined .pin-icon {
    display: flex;
    transform: rotate(0);
  }

  &.pined {
    max-height: 75vh;
    width: 400px;
    max-width: 100%;

    .head {
      border-bottom: 1px solid var(--g-color-70);
      padding: 4px;
      justify-content: space-between;
      flex-direction: row;
      position: relative;

      .logo-icon {
        width: 18px;
        height: 18px;
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
    background: conic-gradient(transparent, rgba(168, 239, 255, 1), transparent 30%);
    animation: rotate 2s linear infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(1turn);
    }
  }
}
</style>
