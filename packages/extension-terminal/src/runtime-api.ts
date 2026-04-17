export const ctx: any = (globalThis as any).ctx

export function registerPlugin (plugin: any) {
  (globalThis as any).registerPlugin(plugin)
}
