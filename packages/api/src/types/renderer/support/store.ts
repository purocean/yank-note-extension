import type { Components, Doc, FileSort, IndexStatus, Repo } from '@fe/types';
import { watch, watchEffect } from 'vue';
export declare const initState: {
    tree: Components.Tree.Node[] | null;
    treeSort: FileSort;
    wordWrap: "on" | "off";
    typewriterMode: boolean;
    showSide: boolean;
    showView: boolean;
    showEditor: boolean;
    showContentRightSide: boolean;
    currentRightSidePanel: string | null;
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
    currentRepoIndexStatus: {
        repo: string;
        status: IndexStatus;
    } | null;
    currentFile: Doc | null | undefined;
    recentOpenTime: Record<string, number>;
    tabs: Components.FileTabs.Item[];
    previewer: string;
    editor: string;
};
export type AppState = typeof initState;
declare const _default: {
    state: {
        tree: {
            type: "file" | "dir";
            mtime?: number | undefined;
            birthtime?: number | undefined;
            marked?: boolean | undefined;
            children?: any[] | undefined;
            level: number;
            name: string;
            repo: string;
            path: string;
        }[] | null;
        treeSort: {
            by: "mtime" | "birthtime" | "name" | "serial";
            order: "asc" | "desc";
        };
        wordWrap: "on" | "off";
        typewriterMode: boolean;
        showSide: boolean;
        showView: boolean;
        showEditor: boolean;
        showContentRightSide: boolean;
        currentRightSidePanel: string | null;
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
            enableIndexing: boolean;
        } | undefined;
        currentRepoIndexStatus: {
            repo: string;
            status: {
                total: number;
                indexed: number;
                processing: string | null;
                cost: number;
                ready: boolean;
            };
        } | null;
        currentFile: {
            name: string;
            content?: string | undefined;
            passwordHash?: string | undefined;
            contentHash?: string | undefined;
            stat?: {
                mtime: number;
                birthtime: number;
                size: number;
            } | undefined;
            writeable?: boolean | undefined;
            status?: ("loaded" | "save-failed" | "saved" | "unsaved") | undefined;
            absolutePath?: string | undefined;
            plain?: boolean | undefined;
            extra?: any;
            type: "file" | "dir" | `__${string}`;
            repo: string;
            path: string;
        } | null | undefined;
        recentOpenTime: Record<string, number>;
        tabs: {
            payload: {
                file: {
                    name: string;
                    content?: string | undefined;
                    passwordHash?: string | undefined;
                    contentHash?: string | undefined;
                    stat?: {
                        mtime: number;
                        birthtime: number;
                        size: number;
                    } | undefined;
                    writeable?: boolean | undefined;
                    status?: ("loaded" | "save-failed" | "saved" | "unsaved") | undefined;
                    absolutePath?: string | undefined;
                    plain?: boolean | undefined;
                    extra?: any;
                    type: "file" | "dir" | `__${string}`;
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
