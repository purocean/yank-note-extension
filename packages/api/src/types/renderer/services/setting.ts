import type { BuildInSettings, SettingGroup, SettingSchema } from '@fe/types';
type Schema = SettingSchema;
/**
 * Get Schema.
 * @returns Schema
 */
export declare function getSchema(): Schema;
/**
 * Change Schema.
 * @param fun
 */
export declare function changeSchema(fun: (schema: Schema) => void): void;
/**
 * Get default settings.
 * @returns settings
 */
export declare function getDefaultSetting(): BuildInSettings;
/**
 * Fetch remote settings and refresh local value.
 * @returns settings
 */
export declare function fetchSettings(): Promise<any>;
/**
 * Write settings.
 * @param settings
 * @returns settings
 */
export declare function writeSettings(settings: Record<string, any>): Promise<any>;
/**
 * Get local settings.
 * @returns settings
 */
export declare function getSettings(): any;
/**
 * get setting val by key
 * @param key
 * @param defaultVal
 * @returns
 */
export declare function getSetting<T extends keyof BuildInSettings>(key: T, defaultVal: BuildInSettings[T]): BuildInSettings[T];
export declare function getSetting<T extends keyof BuildInSettings>(key: T, defaultVal?: null): BuildInSettings[T] | null;
/**
 * set setting val
 * @param key
 * @param val
 * @returns
 */
export declare function setSetting<T extends keyof BuildInSettings>(key: T, val: BuildInSettings[T]): Promise<void>;
/**
 * Show setting panel.
 * @param keyOrGroup
 */
export declare function showSettingPanel(keyOrGroup?: SettingGroup | keyof BuildInSettings): Promise<void>;
export declare function showSettingPanel(keyOrGroup?: string): Promise<void>;
/**
 * Hide setting panel.
 */
export declare function hideSettingPanel(): void;
export {};
