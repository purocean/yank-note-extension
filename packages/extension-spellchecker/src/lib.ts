/* eslint-disable quote-props */
import { getSpellchecker } from 'monaco-spellchecker'
import * as Monaco from '@yank-note/runtime-api/types/types/third-party/monaco-editor'
import { ctx, getExtensionBasePath } from '@yank-note/runtime-api'
import { JSONRPCClient, JSONRPCClientChannel, JSONRPCRequest, JSONRPCResponse } from 'jsonrpc-bridge'
import SpellWorkerUrl from './worker?worker&url'
import type { WorkerMainModule } from './worker'

const DATA_DIRNAME = __EXTENSION_ID__.replace(/\//g, '$')
const DATA_DIR = DATA_DIRNAME + '/'

const IGNORE_FILE = 'ignore.txt'
const USER_DICT_FILE = 'user-dic.txt'

export const settingKeyDicName = 'plugin.spellchecker.dictionary'
export const settingKeyWordRegex = 'plugin.spellchecker.alphabet'
export const defaultDicName = 'en'
export const defaultWordRegex = '[a-zA-Z]+(?:\'[a-zA-Z]+)?'

export const i18n = ctx.i18n.createI18n({
  en: {
    'check-spelling': 'Check Spelling',
    'enable-or-disable-check-spelling-desc': 'Enable or disable spell checking',
    'hover-message': '"%s" is misspelled.',
    'ignore': 'Ignore "%s"',
    'add-word': 'Add "%s" to Dictionary',
    'apply-suggestion': 'Replace with "%s"',
    'setting-dictionary': 'Spellchecker - Dictionary',
    'setting-dictionary-desc': `Place <i>.aff</i> and <i>.dic</i> files with the same basename in the data directory <a href="javascript:ctx.base.showItemInFolder('%s')"><i>${DATA_DIR}</i></a>`,
    'setting-word-regex': 'Spellchecker - Word Regex',
    'setting-word-regex-desc': 'Set the word regex for spell checking, e.g. <i>' + defaultWordRegex + '</i> or <i>[\\p{L}]+</i>',
    'loading-dictionary-error': 'Failed to load dictionary, please check the dictionary files in the data directory.',
  },
  'zh-CN': {
    'check-spelling': '拼写检查',
    'enable-or-disable-check-spelling-desc': '启用或禁用拼写检查',
    'hover-message': '"%s" 拼写错误。',
    'ignore': '忽略 "%s"',
    'add-word': '添加 "%s" 到词典',
    'apply-suggestion': '替换为 "%s"',
    'setting-dictionary': '拼写检查 - 字典',
    'setting-dictionary-desc': `请将同名的 <i>.aff</i> 和 <i>.dic</i> 文件放置到数据目录<a href="javascript:ctx.base.showItemInFolder('%s')"><i>${DATA_DIR}</i></a>下`,
    'setting-word-regex': '拼写检查 - 单词正则表达式',
    'setting-word-regex-desc': '设置拼写检查时的单词正则表达式，例如 <i>' + defaultWordRegex + '</i> 或 <i>[\\p{L}]+</i>',
    'loading-dictionary-error': '加载字典失败，请检查数据目录中的字典文件。',
  },
})

const logger = ctx.utils.getLogger(__EXTENSION_ID__)

async function writeDefaultDict () {
  logger.debug('writeDefaultDict')

  await fetch(ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), `dist/dictionaries/${defaultDicName}/index.aff`)).then(async res => {
    return ctx.api.writeUserFile(DATA_DIR + `${defaultDicName}.aff`, await res.text())
  })

  await fetch(ctx.utils.path.join(getExtensionBasePath(__EXTENSION_ID__), `dist/dictionaries/${defaultDicName}/index.dic`)).then(async res => {
    return ctx.api.writeUserFile(DATA_DIR + `${defaultDicName}.dic`, await res.text())
  })
}

async function loadWordsFile (file: string, buffer: false, throwError?: boolean): Promise<string>
async function loadWordsFile (file: string, buffer: true, throwError?: boolean): Promise<ArrayBuffer>
async function loadWordsFile (file: string, buffer: boolean, throwError = false) {
  try {
    const res = await ctx.api.readUserFile(DATA_DIR + file)
    if (buffer) {
      return res.arrayBuffer()
    } else {
      return (await res.text()).trim()
    }
  } catch (error) {
    if (throwError) {
      throw error
    }

    return ''
  }
}

async function handleWord (word: string, file: string) {
  let content = await loadWordsFile(file, false)
  content = (content.trim() + '\n' + word).trim()
  await ctx.api.writeUserFile(DATA_DIR + file, content)
  return content
}

async function loadDictionary (name: string, autoInitDefaultDic = true): Promise<{ aff: ArrayBuffer, dic: ArrayBuffer } | null> {
  logger.debug('loadDictionary', name)
  return Promise.all([
    loadWordsFile(`${name}.aff`, true, true),
    loadWordsFile(`${name}.dic`, true, true),
  ])
    .then(([aff, dic]) => ({ aff, dic }))
    .catch((err) => {
      logger.warn('loadDictionary', err)
      if (autoInitDefaultDic && name === defaultDicName) {
        return writeDefaultDict().then(() => loadDictionary(name, false))
      } else {
        return null
      }
    })
}

export function buildAlphabetRegex (regex: string, fullback: boolean) {
  if (!regex) {
    return buildAlphabetRegex(defaultWordRegex, false)
  }

  try {
    return new RegExp(`(?<=\\P{L}|^)${regex}(?=\\P{L}|$)`, 'gu')
  } catch (error) {
    if (fullback) {
      return buildAlphabetRegex(defaultWordRegex, false)
    } else {
      throw error
    }
  }
}

class SpellWorkerChannel implements JSONRPCClientChannel {
  worker: Worker

  constructor (worker: Worker) {
    this.worker = worker
  }

  send (message: JSONRPCRequest) {
    this.worker.postMessage({ from: 'spell-main', message })
  }

  setMessageHandler (callback: (msg: JSONRPCResponse) => void) {
    this.worker.addEventListener('message', (event) => {
      const { message, from } = event.data
      if (from === 'spell-worker') {
        callback(message)
      }
    })
  }
}

class SpellService extends JSONRPCClient<WorkerMainModule> {
  worker: Worker

  dispose () {
    logger.debug('dispose')
    this.worker.terminate()
  }

  constructor () {
    const worker = new Worker(new URL(SpellWorkerUrl), { type: 'module' })
    const channel = new SpellWorkerChannel(worker)
    super(channel, { debug: true })
    this.worker = worker
  }
}

export function initSpellchecker (monaco: typeof Monaco, editor: Monaco.editor.IStandaloneCodeEditor,): Monaco.IDisposable {
  let spellService: SpellService | null = null
  let ignoreWords: Set<string> = new Set()
  let dictionary: { aff: ArrayBuffer, dic: ArrayBuffer } | null = null

  const dicName = ctx.setting.getSetting(settingKeyDicName, defaultDicName)
  const alphabet = ctx.setting.getSetting(settingKeyWordRegex, defaultWordRegex)

  const initDictionary = async (additionalDic: string) => {
    logger.debug('initDictionary', dictionary)
    if (dictionary) {
      spellService = new SpellService()
      await spellService.call.main.initDictionary(dictionary.aff, dictionary.dic, additionalDic)
    } else {
      ctx.ui.useToast().show('warning', i18n.t('loading-dictionary-error'))
      ctx.setting.showSettingPanel(settingKeyDicName)
    }
  }

  const initIgnoreWords = (ignore: string) => {
    ignoreWords = new Set(ignore.split('\n').map(w => w.trim().toLowerCase()))
  }

  const checker = getSpellchecker(monaco, editor, {
    * tokenize (text) {
      const regex = buildAlphabetRegex(alphabet, true)
      let match: RegExpExecArray | null
      while ((match = regex.exec(text))) {
        yield { word: match[0], pos: match.index }
      }
    },
    check: (word) => {
      if (!spellService) {
        return true
      }

      if (ignoreWords.has(word.toLowerCase())) {
        return true
      }

      return spellService.call.main.check(word)
    },
    suggest: (word) => {
      return spellService ? spellService.call.main.suggest(word) : []
    },
    ignore: async (word) => {
      const content = await handleWord(word, IGNORE_FILE)
      initIgnoreWords(content)
    },
    addWord: async (word) => {
      await handleWord(word, USER_DICT_FILE)
      spellService?.notify.main.addWord(word)
    },
    messageBuilder: (type, word) => {
      switch (type) {
        case 'hover-message':
          return i18n.t('hover-message', word)
        case 'ignore':
          return i18n.t('ignore', word)
        case 'add-word':
          return i18n.t('add-word', word)
        case 'apply-suggestion':
          return i18n.t('apply-suggestion', word)
        default:
          return ''
      }
    }
  })

  const process = ctx.lib.lodash.debounce(() => {
    // skip processing when the editor is in composition
    if (ctx.store.state.inComposition) return

    checker.process()
  }, 500)

  const disposables: Monaco.IDisposable[] = [
    editor.onDidChangeModelContent(process),
    editor.onDidChangeModel(process),
    checker,
  ]

  Promise.all([
    loadDictionary(dicName),
    loadWordsFile(USER_DICT_FILE, false),
    loadWordsFile(IGNORE_FILE, false),
  ]).then(([dic, userDict, ignore]) => {
    dictionary = dic
    initIgnoreWords(ignore)
    initDictionary(userDict).then(checker.process)
  })

  return {
    dispose () {
      spellService?.dispose()
      spellService = null
      disposables.forEach(d => d.dispose())
    }
  }
}

export async function fetchAvailableDictionaries () {
  const items = await ctx.api.listUserDir(DATA_DIR, true).catch(() => [] as Awaited<ReturnType<typeof ctx.api.listUserDir>>)
  const affs = items.filter(item => item.isFile && item.path.endsWith('.aff')).map(item => item.path.replace(/\.aff$/, ''))
  const dics = items.filter(item => item.isFile && item.path.endsWith('.dic')).map(item => item.path.replace(/\.dic$/, ''))

  const result: string[] = affs.filter(aff => dics.includes(aff))

  if (!result.includes(defaultDicName)) {
    await writeDefaultDict()
    result.push(defaultDicName)
  }

  return result
}
