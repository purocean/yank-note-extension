import type { ThemeName } from '@fe/types';
export interface ThemeStyle {
    from: 'custom' | 'extension';
    name: string;
    css: string;
}
/**
 * Get current theme name.
 * @returns
 */
export declare function getThemeName(): ThemeName;
/**
 * Get current color schema.
 * @returns
 */
export declare function getColorScheme(): "dark" | "light";
/**
 * Set theme.
 * @param name
 */
export declare function setTheme(name: ThemeName): void;
/**
 * Add styles to page.
 * @param style
 * @return style tag id
 */
export declare function addStyles(style: string): string;
/**
 * Remove styles from page.
 * @param id style tag id
 */
export declare function removeStyles(id: string): void;
/**
 * register theme style
 * @param style
 */
export declare function registerThemeStyle(style: ThemeStyle): void;
/**
 * get theme styles
 * @returns
 */
export declare function getThemeStyles(): ThemeStyle[];
/**
 * remove theme styles
 * @param style
 */
export declare function removeThemeStyle(style: ThemeStyle | ((item: ThemeStyle) => boolean)): void;
