<template>
  <div class="text-comparator">
    <div class="options">
      <fieldset class="left">
        <legend>{{ $t('left') }}</legend>
        <div class="row">
          <label @click.capture.stop.prevent="initOriginalType('text')">
            <input type="radio" :disabled="isDirty" :checked="originalType === 'text'" value="text" />
            {{ $t('text') }}
          </label>
          <label style="margin-left: auto">
            <input type="checkbox" v-model="originalReadonly" />
            {{ $t('readonly') }}
          </label>
        </div>
        <div class="row">
          <label @click.capture.stop.prevent="initOriginalType('file')">
            <input type="radio" :disabled="isDirty" :checked="originalType === 'file'" value="file" />
            {{ $t('file') }}
            <template v-if="originalType === 'file' &&  io.original?.file">
              <span class="filename">{{ io.original.file.path }}</span>
              <a @click="buildFileIo('original')">{{ $t('change') }}</a>
            </template>
          </label>
        </div>
      </fieldset>
      <div class="center">
        <div class="row">
          <label>
            <input type="checkbox" v-model="renderSideBySide" />
            {{ $t('side-by-side') }}
          </label>
        </div>
        <div class="row">
          <label>
            <input type="checkbox" v-model="wordWrap" />
            {{ $t('word-wrap') }}
          </label>
        </div>
        <div class="row">
          <label>
            <input type="checkbox" v-model="ignoreTrimWhitespace" />
            {{ $t('ignore-trim-whitespace') }}
          </label>
        </div>
        <div class="row">
          <button class="small" @click="swap" :disabled="isDirty">
            <svg-icon name="arrow-right-arrow-left-solid" width="10px" height="10px" />
            {{ $t('swap') }}
          </button>
        </div>
      </div>
      <fieldset class="right">
        <legend>{{ $t('right') }}</legend>
        <div class="row">
          <label @click.capture.stop.prevent="initModifiedType('text')">
            <input type="radio" :disabled="isDirty" :checked="modifiedType === 'text'" value="text" />
            {{ $t('text') }}
          </label>
          <label style="margin-left: auto">
            <input type="checkbox" v-model="modifiedReadonly" />
            {{ $t('readonly') }}
          </label>
        </div>
        <div class="row">
          <label @click.capture.stop.prevent="initModifiedType('file')">
            <input type="radio" :disabled="isDirty" :checked="modifiedType === 'file'" value="file" />
            {{ $t('file') }}
            <template v-if="modifiedType === 'file' && io.modified?.file">
              <span class="filename">{{ io.modified.file.path }}</span>
              <a @click="buildFileIo('modified')">{{ $t('change') }}</a>
            </template>
          </label>
        </div>
      </fieldset>
    </div>
    <div ref="contentRef" class="content">
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ctx } from '@yank-note/runtime-api'
import type Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { editorDocType, XCustomEditorIO, i18n } from './lib'
import type { Doc } from '@yank-note/runtime-api/types/types/renderer/types'

const { registerHook, removeHook } = ctx
const { defineExpose, nextTick, ref, onMounted, onUnmounted, shallowReactive, watch } = ctx.lib.vue
const { getDefaultOptions, getMonaco, whenEditorReady } = ctx.editor
const { SvgIcon } = ctx.components

const { $t } = i18n

const logger = ctx.utils.getLogger('TextComparator')

let monaco: typeof Monaco
let editor: Monaco.editor.IStandaloneDiffEditor | null = null

type DiffType = 'file' | 'text'
type EditorSide = 'original' | 'modified'

const tmpFiles = {
  original: 'original.txt',
  modified: 'modified.txt',
}

const contentRef = ref<HTMLElement>()
const originalType = ref<DiffType>('text')
const modifiedType = ref<DiffType>('text')
const originalReadonly = ref(true)
const modifiedReadonly = ref(true)
const renderSideBySide = ref(true)
const wordWrap = ref(false)
const ignoreTrimWhitespace = ref(true)
const isDirty = ref(false)

const io = shallowReactive({
  original: null as XCustomEditorIO | null,
  modified: null as XCustomEditorIO | null,
})

function handleResize () {
  if (contentRef.value && editor) {
    editor.layout({
      width: contentRef.value.clientWidth,
      height: contentRef.value.clientHeight,
    })
  }
}

async function createEditor () {
  await whenEditorReady()
  monaco = getMonaco()

  editor = monaco.editor.createDiffEditor(contentRef.value!, {
    ...getDefaultOptions(),
    readOnly: true,
    scrollbar: undefined,
    theme: undefined,
    renderSideBySide: renderSideBySide.value,
    renderSideBySideInlineBreakpoint: 200,
    wordWrap: wordWrap.value ? 'on' : 'off',
    ignoreTrimWhitespace: ignoreTrimWhitespace.value,
    diffAlgorithm: 'advanced',
    hideUnchangedRegions: {
      enabled: true,
    },
  })

  editor.getOriginalEditor().addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveIo)
  editor.getModifiedEditor().addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveIo)

  editor.setModel({
    original: monaco.editor.createModel('', 'markdown'),
    modified: monaco.editor.createModel('', 'markdown'),
  })
}

function updateOriginalEditorOptions () {
  editor?.getOriginalEditor()?.updateOptions({
    readOnly: originalReadonly.value,
  })

  if (!originalReadonly.value) {
    editor?.getOriginalEditor()?.focus()
  }
}

function updateModifiedEditorOptions () {
  editor?.getModifiedEditor()?.updateOptions({
    readOnly: modifiedReadonly.value,
  })

  if (!modifiedReadonly.value) {
    editor?.getModifiedEditor()?.focus()
  }
}

function updateDiffEditorOptions () {
  editor?.updateOptions({
    renderSideBySide: renderSideBySide.value,
    wordWrap: wordWrap.value ? 'on' : 'off',
    ignoreTrimWhitespace: ignoreTrimWhitespace.value,
  })
}

async function setModel (side: EditorSide, model: Monaco.editor.ITextModel) {
  if (!editor) return

  const models = editor.getModel()
  models?.[side]?.dispose()

  editor.setModel({
    original: side === 'original' ? model : (models?.original as any),
    modified: side === 'modified' ? model : (models?.modified as any),
  })

  if (side === 'original') {
    updateOriginalEditorOptions()
  } else {
    updateModifiedEditorOptions()
  }
}

async function buildFileIo (side: EditorSide, doc?: Doc | null): Promise<void> {
  try {
    doc ??= await ctx.routines.chooseDocument(item => ctx.doc.isPlain(item))
    logger.debug(`Choosing ${side} file...`, doc)
    if (!doc) throw new Error('Canceled')

    const editorIo = new XCustomEditorIO(ctx, doc, getAndSyncIsDirty)
    const model = await editorIo.getModel()
    setModel(side, model)
    io[side] = editorIo
  } catch (error) {
    if (String(error).includes('Model already exists')) {
      ctx.ui.useToast().show('warning', 'Can not open the same file in both sides')
    } else if (!String(error).includes('Canceled')) {
      ctx.ui.useToast().show('warning', String(error))
    }

    throw error
  }
}

async function buildTextIo (side: EditorSide) {
  const name = tmpFiles[side]

  const editorIo = new XCustomEditorIO(ctx, {
    type: 'file',
    name,
    path: '/' + name,
    repo: editorDocType,
  }, getAndSyncIsDirty)
  const model = await editorIo.getModel()
  setModel(side, model)
  io[side] = editorIo
}

function getAndSyncIsDirty () {
  const dirty = Object.values(io).some(io => io?.isDirty())
  if (ctx.store.state.currentFile?.type === editorDocType) {
    ctx.store.state.currentFile.status = dirty ? 'unsaved' : undefined
  }

  isDirty.value = dirty

  return dirty
}

async function saveIo () {
  for (const side of ['original', 'modified'] as EditorSide[]) {
    if (io[side]?.isDirty()) {
      logger.debug(`Saving ${side}...`)
      await io[side]?.save()
    }
  }
}

async function swap () {
  const ioOriginal = io.original
  const ioModified = io.modified

  if (ioOriginal && ioModified) {
    io.original = ioModified
    io.modified = ioOriginal

    const modelOriginal = await ioOriginal.getModel()
    const modelModified = await ioModified.getModel()

    editor?.setModel({
      original: modelModified,
      modified: modelOriginal
    })

    const originalReadonlyValue = originalReadonly.value
    originalReadonly.value = modifiedReadonly.value
    modifiedReadonly.value = originalReadonlyValue

    const originalTypeValue = originalType.value
    originalType.value = modifiedType.value
    modifiedType.value = originalTypeValue

    const originalFile = tmpFiles.original
    tmpFiles.original = tmpFiles.modified
    tmpFiles.modified = originalFile

    await nextTick()
  }
}

async function initOriginalType (type: DiffType, doc?: Doc | null) {
  if (type === 'file') {
    await buildFileIo('original', doc)
    originalReadonly.value = true
  } else if (type === 'text') {
    await buildTextIo('original')
    originalReadonly.value = false
  }

  originalType.value = type
}

async function initModifiedType (type: DiffType, doc?: Doc | null) {
  if (type === 'file') {
    await buildFileIo('modified', doc)
    modifiedReadonly.value = true
  } else if (type === 'text') {
    await buildTextIo('modified')
    modifiedReadonly.value = false
  }

  modifiedType.value = type
}

watch(originalReadonly, updateOriginalEditorOptions, { immediate: true })
watch(modifiedReadonly, updateModifiedEditorOptions, { immediate: true })
watch(renderSideBySide, updateDiffEditorOptions, { immediate: true })
watch(wordWrap, updateDiffEditorOptions, { immediate: true })
watch(ignoreTrimWhitespace, updateDiffEditorOptions, { immediate: true })

onMounted(async () => {
  await createEditor()
  registerHook('GLOBAL_RESIZE', handleResize)

  const initDoc = ctx.store.state.currentFile?.extra

  if (initDoc?.original) {
    initOriginalType('file', initDoc.original)
  } else {
    initOriginalType('text')
  }

  if (initDoc?.modified) {
    initModifiedType('file', initDoc.modified)
  } else {
    initModifiedType('text')
  }

  await nextTick()
})

onUnmounted(() => {
  removeHook('GLOBAL_RESIZE', handleResize)
  logger.debug('Disposing editor...')

  const models = editor?.getModel()
  models?.original?.dispose()
  models?.modified?.dispose()
  editor?.dispose()
})

defineExpose({
  getAndSyncIsDirty
})
</script>

<style lang="scss" scoped>
.text-comparator {
  height: 100%;
  width: 100%;
  padding: 16px;
  padding-bottom: 6px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    font-size: 14px;
    flex: none;

    fieldset.left,
    fieldset.right {
      width: 50%;
      padding: 10px;
      border: 1px dashed var(--g-color-70);
      align-self: start;
      min-height: 72px;

      legend {
        font-weight: 500;
        color: var(--g-color-20);
        text-align: center;
      }
    }

    label {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }

    .filename {
      margin-left: 6px;
      font-size: 12px;
      color: var(--g-color-50);

      & + a {
        margin-left: 3px;
        font-size: 12px;
      }
    }

    .row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 6px;
    }

    .center {
      margin: 0 1rem;
      width: 186px;
      flex: none;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }

  .content {
    border: 1px dashed var(--g-color-70);
    height: 100%;
    overflow: hidden;
  }
}
</style>
