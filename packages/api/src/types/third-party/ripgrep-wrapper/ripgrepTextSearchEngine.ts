/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import { IOutputChannel, Maybe } from './ripgrepSearchUtils';
import { ISerializedSearchSuccess, ITextSearchResult, Progress, SearchError, TextSearchOptions, TextSearchPreviewOptions, TextSearchProvider, TextSearchQuery } from './search';
import { CancellationToken } from './cancellation';
export declare class RipgrepTextSearchEngine implements TextSearchProvider {
    private rgDiskPath;
    private outputChannel;
    constructor(rgDiskPath: string, outputChannel: IOutputChannel);
    provideTextSearchResults(query: TextSearchQuery, options: TextSearchOptions, progress: Progress<ITextSearchResult>, token: CancellationToken): Promise<ISerializedSearchSuccess>;
}
/**
 * Read the first line of stderr and return an error for display or undefined, based on a list of
 * allowed properties.
 * Ripgrep produces stderr output which is not from a fatal error, and we only want the search to be
 * "failed" when a fatal error was produced.
 */
export declare function rgErrorMsgForDisplay(msg: string): Maybe<SearchError>;
export declare function buildRegexParseError(lines: string[]): string;
export declare class RipgrepParser extends EventEmitter {
    private maxResults;
    private rootFolder;
    private previewOptions?;
    private remainder;
    private isDone;
    private hitLimit;
    private stringDecoder;
    private numResults;
    constructor(maxResults: number, rootFolder: string, previewOptions?: TextSearchPreviewOptions | undefined);
    cancel(): void;
    flush(): void;
    on(event: 'result', listener: (result: ITextSearchResult) => void): this;
    on(event: 'hitLimit', listener: () => void): this;
    handleData(data: Buffer | string): void;
    private handleDecodedData;
    private handleLine;
    private createTextSearchMatch;
    private createTextSearchContext;
    private onResult;
}
/**
 * `"foo/*bar/something"` -> `["foo", "foo/*bar", "foo/*bar/something", "foo/*bar/something/**"]`
 */
export declare function spreadGlobComponents(globArg: string): string[];
export declare function unicodeEscapesToPCRE2(pattern: string): string;
export interface IRgMessage {
    type: 'match' | 'context' | string;
    data: IRgMatch;
}
export interface IRgMatch {
    path: IRgBytesOrText;
    lines: IRgBytesOrText;
    line_number: number;
    absolute_offset: number;
    submatches: IRgSubmatch[];
}
export interface IRgSubmatch {
    match: IRgBytesOrText;
    start: number;
    end: number;
}
export type IRgBytesOrText = {
    bytes: string;
} | {
    text: string;
};
export declare function fixRegexNewline(pattern: string): string;
export declare function fixNewline(pattern: string): string;
