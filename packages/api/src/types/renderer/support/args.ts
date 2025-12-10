import type { ResourceTagName } from '@fe/types';
/**
 * Get all params from url.
 * @returns params
 */
export declare function $args(): URLSearchParams;
export declare const URL_GITHUB = "https://github.com/purocean/yn";
export declare const URL_MAS = "https://apps.apple.com/cn/app/yank-note/id1551528618";
export declare const URL_MAS_LIMITATION = "https://github.com/purocean/yn/issues/65#issuecomment-1065799677";
export declare const JWT_TOKEN: string;
export declare const MODE: 'normal' | 'share-preview';
export declare const FLAG_DISABLE_SHORTCUTS: boolean;
export declare const FLAG_DISABLE_XTERM = false;
export declare const FLAG_MAS = false;
export declare const FLAG_DEMO: boolean;
export declare const FLAG_READONLY: boolean;
export declare const FLAG_DEBUG: boolean;
export declare const HELP_REPO_NAME = "__help__";
export declare const MONACO_EDITOR_NLS: {
    de: string;
    es: string;
    fr: string;
    it: string;
    ja: string;
    ko: string;
    ru: string;
    'zh-cn': string;
    'zh-tw': string;
};
export declare const RESOURCE_TAG_NAMES: ResourceTagName[];
export declare const CSS_VAR_NAME: {
    PREVIEWER_HEIGHT: string;
};
export declare const DOM_ATTR_NAME: {
    SOURCE_LINE_START: string;
    SOURCE_LINE_END: string;
    ORIGIN_SRC: string;
    TARGET_REPO: string;
    TARGET_PATH: string;
    LOCAL_IMAGE: string;
    ONLY_CHILD: string;
    TOKEN_IDX: string;
    DISPLAY_NONE: string;
    WIKI_LINK: string;
    WIKI_RESOURCE: string;
    IS_ANCHOR: string;
    SKIP_EXPORT: string;
    DATA_HASHTAG: string;
};
export declare const DOM_CLASS_NAME: {
    HASH_TAG: string;
    PREVIEW_HIGHLIGHT: string;
    PREVIEW_MARKDOWN_BODY: string;
    MARK_OPEN: string;
    SKIP_EXPORT: string;
    SKIP_PRINT: string;
    REDUCE_BRIGHTNESS: string;
    INLINE: string;
    BLOCK: string;
    BGW: string;
    COPY_INNER_TEXT: string;
    WRAP_CODE: string;
    WITH_BORDER: string;
    TEXT_LEFT: string;
    TEXT_CENTER: string;
    TEXT_RIGHT: string;
    TASK_LIST_ITEM_CHECKBOX: string;
    NEW_PAGE: string;
    AVOID_PAGE_BREAK: string;
    CODE_SYNTAX_HIGHLIGHT_FONT: string;
};
