import type { Ctx as _Ctx } from '@fe/context'
import type * as _Setting from '@fe/services/setting'
import type { Plugin } from '@fe/core/plugin'
import { BuildInSettings } from '@fe/types'

type __Setting = typeof _Setting;

interface Setting extends __Setting {
  getSetting<T>(key: string, defaultVal?: T): T;
  getSetting<T extends keyof BuildInSettings>(key: T, defaultVal: BuildInSettings[T]): BuildInSettings[T];
  getSetting<T extends keyof BuildInSettings>(key: T, defaultVal?: null): BuildInSettings[T] | null;
}

export interface Ctx extends _Ctx {
  setting: Setting;
}

export const ctx: Ctx = globalThis.ctx

export function registerPlugin (plugin: Plugin<Ctx>) {
  globalThis.registerPlugin(plugin)
}

export function getExtensionBasePath (id: string): string {
  return '/extensions/' + id.replace(/\//g, '$')
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
