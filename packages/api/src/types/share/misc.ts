import { Language } from './i18n';
export declare const MARKDOWN_FILE_EXT = ".md";
export declare const ENCRYPTED_MARKDOWN_FILE_EXT = ".c.md";
export declare const DOC_HISTORY_MAX_CONTENT_LENGTH = 102400;
export declare const ROOT_REPO_NAME_PREFIX = "__root__";
export declare const DEFAULT_EXCLUDE_REGEX = "^node_modules/$|^\\.git/$|^\\.DS_Store$|^\\.";
export declare const PREMIUM_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqkiGs7j0xH+RJEHvqZ33\n+7nt+tmj5eod4BYbwVWLfoIfAM9dTCUwZkEDEWI2V9W0cYV6eAu4JwKMJqn76jRn\n0S87wtT9H6W2zbbvjK2aia/oCkRilNNOMgV9V6P+ZD0VyDVUSBHWJQk3tOSHf/nS\nGW2hnKqao+loVyuHQQiYp6Iq3ti4Eu+t88LfpxvVZ5uuKmMLo6LbnOMuTFa9mGUE\nR1VuHglANFSi45+45PRHkGlpwjwnlFCTmj137h/djQ//NinJ73CeI3xHD6+Spppy\n259/Ksv+uI/zV39VZWsCrhJkc1pRSUXApKxqXbrMUD2z60Wqz3ps+arn9YeHPR/k\nDQIDAQAB\n-----END PUBLIC KEY-----";
export declare const API_BASE_URL = "https://yank-note.com";
export declare const HOMEPAGE_URL = "https://yank-note.com";
export declare const GUIDE_URL = "https://help.yank-note.com";
export declare function isMarkdownFile(path: string): boolean;
export declare function isEncryptedMarkdownFile(path: string): boolean;
export declare function getDefaultApplicationAccelerators(platform: NodeJS.Platform, lang?: Language): {
    command: "show-main-window" | "hide-main-window" | "open-in-browser";
    accelerator: string | null;
    description: string;
}[];
