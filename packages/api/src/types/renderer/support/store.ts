import type { Components, Doc, Repo } from '@fe/types';
export declare const initState: {
    tree: Components.Tree.Node[] | null;
    wordWrap: "on" | "off";
    typewriterMode: boolean;
    showSide: boolean;
    showView: boolean;
    showEditor: boolean;
    showXterm: boolean;
    showOutline: boolean;
    autoPreview: boolean;
    syncScroll: boolean;
    showSetting: boolean;
    showExport: boolean;
    showControlCenter: boolean;
    presentation: boolean;
    isFullscreen: boolean;
    currentContent: string;
    inComposition: boolean;
    currentRepo: Repo | undefined;
    currentFile: Doc | null;
    recentOpenTime: Record<string, number>;
    tabs: Components.FileTabs.Item[];
    selectionInfo: {
        textLength: number;
        selectedLength: number;
        lineCount: number;
        line: number;
        column: number;
    };
};
export declare type AppState = typeof initState;
declare const _default: import("vuex").Store<{
    tree: Components.Tree.Node[] | null;
    wordWrap: "on" | "off";
    typewriterMode: boolean;
    showSide: boolean;
    showView: boolean;
    showEditor: boolean;
    showXterm: boolean;
    showOutline: boolean;
    autoPreview: boolean;
    syncScroll: boolean;
    showSetting: boolean;
    showExport: boolean;
    showControlCenter: boolean;
    presentation: boolean;
    isFullscreen: boolean;
    currentContent: string;
    inComposition: boolean;
    currentRepo: Repo | undefined;
    currentFile: Doc | null;
    recentOpenTime: Record<string, number>;
    tabs: Components.FileTabs.Item[];
    selectionInfo: {
        textLength: number;
        selectedLength: number;
        lineCount: number;
        line: number;
        column: number;
    };
}>;
export default _default;
