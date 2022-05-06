import type { Ctx as _Ctx } from '@fe/context'
import type * as _I18n from '@fe/services/i18n'
import { Ref } from 'vue'
import type { Plugin } from '@fe/core/plugin'
import type { MsgPath } from '@share/i18n'

type __I18n = typeof _I18n;

interface I18n extends __I18n {
  t (path: MsgPath, ...args: string[]): string;
  t (path: string, ...args: string[]): string;
  useI18n: () => {
    t: I18n['t'],
    $t: Ref<I18n['t']>,
    setLanguage: I18n['setLanguage'],
    getLanguage: I18n['getLanguage']
  };
}

export interface Ctx extends _Ctx {
  i18n: I18n
}

export const ctx: Ctx = globalThis.ctx
export function registerPlugin (plugin: Plugin<Ctx>) {
  globalThis.registerPlugin(plugin)
}

export const YN_LIBS = {
  vue: 'ctx.lib.vue',
  semver: 'ctx.lib.semver',
  dayjs: 'ctx.lib.dayjs',
  'crypto-js': 'ctx.lib.cryptojs',
  turndown: 'ctx.lib.turndown',
  juice: 'ctx.lib.juice',
  sortablejs: 'ctx.lib.sortablejs',
  'filenamify/browser': 'ctx.lib.filenamify',
  mime: 'ctx.lib.mime',
  'markdown-it': 'ctx.lib.markdownit',
  'dom-to-image': 'ctx.lib.domtoimage',
  pako: 'ctx.lib.pako',
}
