import Markdown from 'markdown-it';
/**
 * Markdown-it instance
 */
export declare const markdown: Markdown;
/**
 * Register a Markdown-it plugin.
 * @param plugin Markdown-it plugin
 * @param params plugin params
 */
export declare function registerPlugin(plugin: (md: Markdown, ...args: any) => void, params?: any): void;
