import type { Components } from '@fe/types';
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
    toggle(visible?: boolean | undefined): void;
};
