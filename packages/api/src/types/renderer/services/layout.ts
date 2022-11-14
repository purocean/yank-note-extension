import type { Components } from '@fe/types';
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
 * Toggle outline visible.
 * @param visible
 */
export declare function toggleOutline(visible?: boolean): void;
/**
 * Toggle editor preview exclusive.
 * @param exclusive
 */
export declare function toggleEditorPreviewExclusive(exclusive?: boolean): void;
/**
 * Refresh tabs action buttons.
 */
export declare function refreshTabsActionBtns(): void;
/**
 * Add a tabs action button processor.
 * @param tapper
 */
export declare function tapTabsActionBtns(tapper: (btns: Components.Tabs.ActionBtn[]) => void): void;
/**
 * Remove a tabs action button processor.
 * @param tapper
 */
export declare function removeTabsActionBtnTapper(tapper: (btns: Components.Tabs.ActionBtn[]) => void): void;
/**
 * Get tabs action buttons.
 * @returns
 */
export declare function getTabsActionBtns(): Components.Tabs.ActionBtn[];
