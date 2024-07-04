import type { BuildInHookTypes, Components, Previewer } from '@fe/types';
export type MenuItem = Components.ContextMenu.Item;
export type BuildContextMenu = (items: MenuItem[], e: MouseEvent) => void;
export type Heading = {
    tag: string;
    class: string;
    text: string;
    level: number;
    sourceLine: number;
    activated?: boolean;
};
/**
 * Rerender view.
 */
export declare function render(): void;
/**
 * Render Markdown immediately.
 */
export declare function renderImmediately(): void;
/**
 * Refresh view.
 */
export declare function refresh(): Promise<void>;
/**
 * Reveal line.
 * @param startLine
 */
export declare function revealLine(startLine: number): Promise<HTMLElement | null>;
/**
 * Highlight line.
 * @param line
 * @@param reveal
 * @param duration
 */
export declare function highlightLine(line: number, reveal: boolean, duration?: number): Promise<HTMLElement | null | undefined>;
/**
 * Highlight anchor.
 * @param anchor
 * @param reveal
 * @param duration
 */
export declare function highlightAnchor(anchor: string, reveal: boolean, duration?: number): Promise<HTMLElement | null>;
/**
 * Scroll to a position.
 * @param top
 */
export declare function scrollTopTo(top: number): Promise<void>;
export declare function getScrollTop(): number | undefined;
export declare function getPreviewStyles(): string;
/**
 * Get rendered HTML.
 * @param options
 * @returns HTML
 */
export declare function getContentHtml(options?: BuildInHookTypes['VIEW_ON_GET_HTML_FILTER_NODE']['options']): Promise<string>;
/**
 * Get view dom.
 * @returns
 */
export declare function getViewDom(): HTMLElement | null;
/**
 * Get Headings
 */
export declare function getHeadings(withActivated?: boolean): Heading[];
/**
 * Get render env.
 * @returns
 */
export declare function getRenderEnv(): import("@fe/types").RenderEnv | null;
/**
 * Enter presentation mode.
 */
export declare function enterPresent(): void;
/**
 * Exit presentation mode.
 */
export declare function exitPresent(): void;
/**
 * Toggle auto render preview.
 * @param flag
 */
export declare function toggleAutoPreview(flag?: boolean): void;
/**
 * Toggle sync scroll.
 * @param flag
 */
export declare function toggleSyncScroll(flag?: boolean): void;
/**
 * Add a context menu processor.
 * @param fun
 */
export declare function tapContextMenus(fun: BuildContextMenu): void;
/**
 * Switch current previewer
 * @param name Previewer name
 */
export declare function switchPreviewer(name: string): void;
/**
 * Register a previewer.
 * @param previewer Previewer
 */
export declare function registerPreviewer(previewer: Previewer): void;
/**
 * Remove a previewer.
 * @param name Previewer name
 */
export declare function removePreviewer(name: string): void;
/**
 * Get all previewers.
 * @returns Previewers
 */
export declare function getAllPreviewers(): Previewer[];
/**
 * Get context menus
 * @param e
 * @returns
 */
export declare function getContextMenuItems(e: MouseEvent): Components.ContextMenu.Item[];
/**
 * get enableSyncScroll
 * @returns
 */
export declare function getEnableSyncScroll(): boolean | null | undefined;
/**
 * disable sync scroll for a while
 * @param fn
 * @param timeout
 */
export declare function disableSyncScrollAwhile(fn: Function, timeout?: number): Promise<void>;
/**
 * Get render Iframe
 * @returns
 */
export declare function getRenderIframe(): Promise<HTMLIFrameElement>;
/**
 * Add styles to default preview.
 * @param style
 * @return css dom
 */
export declare function addStyles(style: string): Promise<HTMLStyleElement>;
/**
 * Add style link to default preview.
 * @param href
 * @returns link dom
 */
export declare function addStyleLink(href: string): Promise<HTMLLinkElement>;
/**
 * Add script to default preview.
 * @param src
 * @returns script dom
 */
export declare function addScript(src: string): Promise<HTMLScriptElement>;
