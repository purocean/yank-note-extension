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
 * Add a node action buttons processor.
 * @param fun
 */
export declare function tapNodeActionButtons(fun: (btns: Components.Tree.NodeActionBtn[], currentNode: Components.Tree.Node) => void): void;
/**
 * Get node action buttons.
 */
export declare function getNodeActionButtons(currentNode: Components.Tree.Node): Components.Tree.NodeActionBtn[];
/**
 * Refresh file tree.
 */
export declare function refreshTree(): Promise<void>;
/**
 * Reveal current node.
 */
export declare function revealCurrentNode(): void;
