import { Ref } from 'vue';
import type { Components } from '@fe/types';
export type MenuItem = Components.ContextMenu.Item;
export type VueCtx = {
    localMarked: Ref<boolean | null>;
};
export type BuildContextMenu = (items: MenuItem[], node: Components.Tree.Node, vueCtx: VueCtx) => void;
/**
 * Add a context menu processor.
 * @param fun
 */
export declare function tapContextMenus(fun: BuildContextMenu): void;
/**
 * Get context menus
 * @param node
 * @param vueCtx
 * @returns
 */
export declare function getContextMenuItems(node: Components.Tree.Node, vueCtx: VueCtx): Components.ContextMenu.Item[];
/**
 * Refresh file tree.
 */
export declare function refreshTree(): Promise<void>;
/**
 * Reveal current node.
 */
export declare function revealCurrentNode(): void;
