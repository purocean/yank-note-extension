import { ISearchRange, TextSearchMatch, TextSearchPreviewOptions } from './search';
export type Maybe<T> = T | null | undefined;
export declare function anchorGlob(glob: string): string;
/**
 * Create a vscode.TextSearchMatch by using our internal TextSearchMatch type for its previewOptions logic.
 */
export declare function createTextSearchResult(path: string, text: string, ranges: ISearchRange | ISearchRange[], previewOptions?: TextSearchPreviewOptions): TextSearchMatch;
export interface IOutputChannel {
    appendLine(msg: string): void;
}
export declare class OutputChannel implements IOutputChannel {
    private prefix;
    constructor(prefix: string);
    appendLine(msg: string): void;
}
