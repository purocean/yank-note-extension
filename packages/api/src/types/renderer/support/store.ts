import type { Components, Doc, FileSort, Repo } from '@fe/types';
import { watch, watchEffect } from 'vue';
export declare const initState: {
    tree: Components.Tree.Node[] | null;
    treeSort: FileSort;
    wordWrap: "on" | "off";
    typewriterMode: boolean;
    showSide: boolean;
    showView: boolean;
    showEditor: boolean;
    editorPreviewExclusive: boolean;
    showXterm: boolean;
    showOutline: boolean;
    autoPreview: boolean;
    syncScroll: boolean;
    showSetting: boolean;
    showExport: boolean;
    presentation: boolean;
    isFullscreen: boolean;
    currentContent: string;
    inComposition: boolean;
    currentRepo: Repo | undefined;
    currentFile: Doc | null | undefined;
    recentOpenTime: Record<string, number>;
    tabs: Components.FileTabs.Item[];
    previewer: string;
    editor: string;
};
export declare type AppState = typeof initState;
declare const _default: {
    state: {
        tree: {
            mtime?: number | undefined;
            birthtime?: number | undefined;
            marked?: boolean | undefined;
            children?: any[] | undefined;
            level: number;
            name: string;
            repo: string;
            path: string;
            type: "dir" | "file";
        }[] | null;
        treeSort: {
            by: "name" | "mtime" | "birthtime" | "serial";
            order: "desc" | "asc";
        };
        wordWrap: "on" | "off";
        typewriterMode: boolean;
        showSide: boolean;
        showView: boolean;
        showEditor: boolean;
        editorPreviewExclusive: boolean;
        showXterm: boolean;
        showOutline: boolean;
        autoPreview: boolean;
        syncScroll: boolean;
        showSetting: boolean;
        showExport: boolean;
        presentation: boolean;
        isFullscreen: boolean;
        currentContent: string;
        inComposition: boolean;
        currentRepo: {
            name: string;
            path: string;
        } | undefined;
        currentFile: {
            type: "dir" | "file";
            name: string;
            content?: string | undefined;
            title?: string | undefined;
            passwordHash?: string | undefined;
            contentHash?: string | undefined;
            stat?: {
                mtime: number;
                birthtime: number;
                size: number;
            } | undefined;
            status?: "unsaved" | "saved" | "save-failed" | "loaded" | undefined;
            absolutePath?: string | undefined;
            plain?: boolean | undefined;
            repo: string;
            path: string;
        } | null | undefined;
        recentOpenTime: {
            [x: string]: number;
        };
        tabs: {
            payload: {
                file: {
                    type: "dir" | "file";
                    name: string;
                    content?: string | undefined;
                    title?: string | undefined;
                    passwordHash?: string | undefined;
                    contentHash?: string | undefined;
                    stat?: {
                        mtime: number;
                        birthtime: number;
                        size: number;
                    } | undefined;
                    status?: "unsaved" | "saved" | "save-failed" | "loaded" | undefined;
                    absolutePath?: string | undefined;
                    plain?: boolean | undefined;
                    repo: string;
                    path: string;
                } | null;
            };
            key: string;
            label: string;
            description?: string | undefined;
            fixed?: boolean | undefined;
            temporary?: boolean | undefined;
            class?: string | undefined;
        }[];
        previewer: string;
        editor: string;
    };
    watch: typeof watch;
    watchEffect: typeof watchEffect;
    getters: {
        isSaved: import("vue").ComputedRef<boolean>;
    };
};
export default _default;
