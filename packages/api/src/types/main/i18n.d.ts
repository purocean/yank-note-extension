import { Language, MsgPath } from '../share/i18n';
export declare type LanguageName = 'system' | Language;
export declare function $t(path: MsgPath, ...args: string[]): string;
export declare function setLanguage(language?: LanguageName): void;
