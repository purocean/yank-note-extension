import { Flat, Language, MsgPath } from '@share/i18n';
import { LanguageName } from '@fe/types';
/**
 * Get current used language.
 */
export declare function getCurrentLanguage(): Language;
/**
 * Translate
 * @param path
 * @param args
 * @returns
 */
export declare function t(path: MsgPath, ...args: string[]): string;
/**
 * Dynamic translate
 * @param path
 * @param args
 * @returns
 */
export declare function $$t(path: MsgPath, ...args: string[]): string;
/**
 * Get language
 * @returns
 */
export declare function getLanguage(): "system" | "en" | "zh-CN" | "zh-TW" | "ru";
/**
 * Set language
 * @param language
 */
export declare function setLanguage(language: LanguageName): void;
/**
 * Merge natural language strings
 * @param lang
 * @param nls
 */
export declare function mergeLanguage(lang: Language, nls: Record<string, any>): void;
/**
 * For vue setup, auto refresh when language change.
 * @returns
 */
export declare function useI18n(): {
    t: typeof t;
    $t: import("vue").Ref<typeof t, typeof t>;
    setLanguage: typeof setLanguage;
    getLanguage: typeof getLanguage;
};
/**
 * create i18n
 * @param data - language data
 * @param defaultLanguage - default language
 * @returns t is translate function, $t is ref of t, $$t is dynamic translate function
 */
export declare function createI18n<T extends Record<string, any>>(data: {
    [lang in Language]?: T;
}, defaultLanguage?: Language): {
    t: (path: keyof Flat<T, "">, ...args: string[]) => string;
    $t: import("vue").Ref<(path: keyof Flat<T, "">, ...args: string[]) => string, (path: keyof Flat<T, "">, ...args: string[]) => string>;
    $$t: (path: keyof Flat<T, "">, ...args: string[]) => string;
};
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $t: typeof t;
    }
}
