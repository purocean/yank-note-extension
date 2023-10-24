interface Opts {
    caseSensitive?: boolean;
    regex?: boolean;
}
export interface IFindInPreview {
    exec(pattern: string, opts: Opts): void;
    getStats(): {
        count: number;
        current: number;
    };
    next(): boolean;
    prev(): boolean;
}
export declare class BrowserFindInPreview implements IFindInPreview {
    private _matchCount;
    private _win;
    private _maxMatchCount;
    private _maxMatchTime;
    private _wrapAround;
    private _matches;
    private _currentMatchIndex;
    private _opts;
    private _pattern;
    private _exceed;
    constructor(win: Window, opts?: {
        maxMatchCount?: number;
        maxMatchTime?: number;
        wrapAround?: boolean;
    });
    exec(pattern: string, opts: Opts): void;
    getStats(): {
        count: number;
        current: number;
        exceed: boolean;
    };
    next(): boolean;
    prev(): boolean;
    private _search;
}
export {};
