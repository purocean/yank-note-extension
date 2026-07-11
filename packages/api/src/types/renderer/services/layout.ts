export type LayoutContainerName = 'layout' | 'aside' | 'right' | 'content' | 'editor' | 'preview' | 'terminal' | 'contentRightSide';
/**
 * Set layout container dom.
 * @param name
 * @param dom
 */
export declare function setContainerDom(name: LayoutContainerName, dom: HTMLElement | null): void;
/**
 * Get layout container dom.
 * @param name
 * @returns
 */
export declare function getContainerDom(name: LayoutContainerName): HTMLElement | null;
/**
 * Trigger resize hook after next tick.
 */
export declare function emitResize(): void;
/**
 * Toggle side bar visible.
 * @param visible
 */
export declare function toggleSide(visible?: boolean): void;
/**
 * Toggle preview visible.
 * @param visible
 */
export declare function toggleView(visible?: boolean): void;
/**
 * Toggle editor visible.
 * @param visible
 */
export declare function toggleEditor(visible?: boolean): void;
/**
 * Toggle integrated terminal visible.
 * @param visible
 */
export declare function toggleXterm(visible?: boolean): void;
/**
 * Toggle content right side bar visible.
 * @param visible
 */
export declare function toggleContentRightSide(visible?: boolean): void;
/**
 * Toggle editor preview exclusive.
 * @param exclusive
 */
export declare function toggleEditorPreviewExclusive(exclusive?: boolean): void;
