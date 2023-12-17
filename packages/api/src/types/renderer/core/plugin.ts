export interface Plugin<Ctx = any> {
    name: string;
    register?: (ctx: Ctx) => any;
}
/**
 * Register a plugin.
 * @param plugin
 * @param ctx
 */
export declare function register<Ctx>(plugin: Plugin<Ctx>, ctx: Ctx): void;
/**
 * Get a plugin exported api.
 * @param name
 * @returns
 */
export declare function getApi<T = any>(name: string): T;
/**
 * Initialization plugin system and register build-in plugins
 * @param plugins
 * @param ctx
 */
export declare function init<Ctx>(plugins: Plugin[], ctx: Ctx): void;
