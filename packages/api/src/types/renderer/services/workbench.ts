import type { Components, RightSidePanel } from '@fe/types';
/**
 * Toggle outline visible.
 * @param visible
 */
export declare function toggleOutline(visible?: boolean): void;
export declare const FileTabs: {
    /**
     * Refresh tabs action buttons.
     */
    refreshActionBtns(): void;
    /**
     * Add a tabs action button processor.
     * @param tapper
     */
    tapActionBtns(tapper: (btns: Components.Tabs.ActionBtn[]) => void): void;
    /**
     * Remove a tabs action button processor.
     * @param tapper
     */
    removeActionBtnTapper(tapper: (btns: Components.Tabs.ActionBtn[]) => void): void;
    /**
     * Get tabs action buttons.
     * @returns
     */
    getActionBtns(): Components.Tabs.ActionBtn[];
    /**
     * Add a tab context menu processor.
     * @param tapper
     */
    tapTabContextMenus(tapper: (items: Components.ContextMenu.Item[], tab: Components.Tabs.Item) => void): void;
    /**
     * Remove a tab context menu processor.
     * @param tapper
     */
    removeTabContextMenuTapper(tapper: (items: Components.ContextMenu.Item[], tab: Components.Tabs.Item) => void): void;
    /**
     * Get tab context menus.
     * @param tab
     * @returns
     */
    getTabContextMenus(tab: Components.Tabs.Item): Components.ContextMenu.Item[];
};
export declare const ControlCenter: {
    /**
     * Refresh control center.
     */
    refresh(): void;
    /**
     * Add a schema processor.
     * @param tapper
     */
    tapSchema(tapper: Components.ControlCenter.SchemaTapper): void;
    /**
     * Get schema.
     * @returns
     */
    getSchema(): Components.ControlCenter.Schema;
    /**
     * Toggle visible
     * @param visible
     */
    toggle(visible?: boolean): void;
};
export declare const ContentRightSide: {
    /**
     * Register a right side panel.
     * @param panel Panel
     * @param override Override the existing panel
     */
    registerPanel(panel: RightSidePanel, override?: boolean): void;
    /**
     * Remove a right side panel.
     * @param name Panel name
     */
    removePanel(name: string): void;
    /**
     * Get all registered panels.
     * @returns Panels
     */
    getAllPanels(): RightSidePanel[];
    /**
     * Switch to a panel by name.
     * @param name Panel name
     */
    switchPanel(name: string): void;
    /**
     * Show right side panel with a specific panel.
     * @param name Panel name, if not provided, show the current or first panel
     */
    show(name?: string): void;
    /**
     * Hide right side panel.
     */
    hide(): void;
    /**
     * Toggle right side panel visibility.
     * @param visible
     */
    toggle(visible?: boolean): void;
};
