import { MsgPath } from '@share/i18n';
import type { BuildInSettings, SettingGroup } from '@fe/types';
export declare type TTitle = keyof {
    [K in MsgPath as `T_${K}`]: never;
};
export declare type Schema = {
    type: string;
    title: TTitle;
    properties: {
        [K in keyof BuildInSettings]: {
            type: string;
            title: TTitle;
            description?: TTitle;
            required?: boolean;
            defaultValue: BuildInSettings[K] extends any ? BuildInSettings[K] : any;
            enum?: string[] | number[];
            group: SettingGroup;
            items?: {
                type: string;
                title: TTitle;
                properties: {
                    [K in string]: {
                        type: string;
                        title: TTitle;
                        description?: TTitle;
                        options: {
                            inputAttributes: {
                                placeholder: TTitle;
                            };
                        };
                    };
                };
            };
            [key: string]: any;
        };
    };
    required: (keyof BuildInSettings)[];
    groups: {
        label: TTitle;
        value: SettingGroup;
    }[];
};
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
 * @param group
 */
export declare function showSettingPanel(group?: string): void;
/**
 * Hide setting panel.
 */
export declare function hideSettingPanel(): void;
