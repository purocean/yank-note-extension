import { Language, MsgPath } from '@share/i18n';
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
 * Get language
 * @returns
 */
export declare function getLanguage(): "en" | "zh-CN" | "system";
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
    $t: import("vue").Ref<typeof t>;
    setLanguage: typeof setLanguage;
    getLanguage: typeof getLanguage;
};
declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $t: typeof t;
    }
}
