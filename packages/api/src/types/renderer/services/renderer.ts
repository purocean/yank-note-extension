import type { VNode } from 'vue';
import type { RenderEnv, Renderer } from '@fe/types';
/**
 * Get render cache
 * @param domain
 * @param key
 * @returns
 */
export declare function getRenderCache(domain: string): Map<string, any>;
export declare function getRenderCache<T>(domain: string, key: string, fallback?: T | (() => T)): T;
export declare function render(src: string, env: RenderEnv): VNode | VNode[] | string;
export declare function registerRenderer(renderer: Renderer): void;
export declare function removeRenderer(name: string): void;
