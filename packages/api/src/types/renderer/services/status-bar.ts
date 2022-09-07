import type { Component } from 'vue';
export declare type MenuItem = {
    id: string;
    type: 'normal';
    title: string;
    tips?: string;
    subTitle?: string;
    disabled?: boolean;
    hidden?: boolean;
    checked?: boolean;
    order?: number;
    onClick?: (item: MenuItem) => void;
} | {
    type: 'separator';
    order?: number;
    hidden?: boolean;
};
export interface Menu {
    id: string;
    title?: string | Component;
    tips?: string;
    icon?: string;
    hidden?: boolean;
    position: 'left' | 'right';
    order?: number;
    list?: MenuItem[];
    onClick?: (menu: Menu) => void;
    onMousedown?: (menu: Menu) => void;
}
export declare type Menus = {
    [id: string]: Menu;
};
export declare type MenuTapper = (menus: Menus) => void;
/**
 * Refresh status bar menus.
 */
export declare function refreshMenu(): void;
/**
 * Add a menu processor.
 * @param tapper
 */
export declare function tapMenus(tapper: MenuTapper): void;
/**
 * Get status bar menus by position.
 * @param position
 * @returns
 */
export declare function getMenus(position: string): Menu[];
