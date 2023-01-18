import { CancellationToken } from './cancellation';
import * as glob from './glob';
export type ITextSearchResult = ITextSearchMatch | ITextSearchContext;
export interface IExtendedExtensionSearchOptions {
    usePCRE2?: boolean;
}
export interface ISerializedFileMatch {
    path: string;
    results?: ITextSearchResult[];
    numMatches?: number;
}
export interface ITextSearchResultPreview {
    text: string;
    matches: ISearchRange | ISearchRange[];
}
export interface ITextSearchMatch {
    path: string;
    ranges: ISearchRange | ISearchRange[];
    preview: ITextSearchResultPreview;
}
export interface ITextSearchContext {
    path: string;
    text: string;
    lineNumber: number;
}
export interface IFileMatch {
    path: string;
    results?: ITextSearchResult[];
}
export interface ISerializedFileMatch {
    path: string;
    results?: ITextSearchResult[];
    numMatches?: number;
}
export interface ICommonQueryProps {
    /** For telemetry - indicates what is triggering the source */
    _reason?: string;
    folderQueries: IFolderQuery[];
    includePattern?: glob.IExpression;
    excludePattern?: glob.IExpression;
    extraFilePaths?: string[];
    onlyOpenEditors?: boolean;
    maxResults?: number;
    usingSearchPaths?: boolean;
}
export interface ITextSearchPreviewOptions {
    matchLines: number;
    charsPerLine: number;
}
export interface ITextQuery extends ICommonQueryProps {
    contentPattern: IPatternInfo;
    previewOptions?: ITextSearchPreviewOptions;
    maxFileSize?: number;
    usePCRE2?: boolean;
    afterContext?: number;
    beforeContext?: number;
    userDisabledExcludesAndIgnoreFiles?: boolean;
}
export interface IProgressMessage {
    message: string;
}
export declare enum TextSearchCompleteMessageType {
    Information = 1,
    Warning = 2
}
export interface ITextSearchCompleteMessage {
    text: string;
    type: TextSearchCompleteMessageType;
    trusted?: boolean;
}
export interface ISerializedSearchSuccess {
    limitHit: boolean;
    messages?: ITextSearchCompleteMessage[];
}
export type ProviderResult<T> = T | undefined | null | Thenable<T | undefined | null>;
export interface TextSearchProvider {
    provideTextSearchResults(query: TextSearchQuery, options: TextSearchOptions, progress: IProgress<ITextSearchResult>, token: CancellationToken): ProviderResult<ISerializedSearchSuccess>;
}
export declare class QueryGlobTester {
    private _excludeExpression;
    private _parsedExcludeExpression;
    private _parsedIncludeExpression;
    constructor(config: ITextQuery, folderQuery: IFolderQuery);
    matchesExcludesSync(testPath: string, basename?: string, hasSibling?: (name: string) => boolean): boolean;
    /**
     * Guaranteed sync - siblingsFn should not return a promise.
     */
    includedInQuerySync(testPath: string, basename?: string, hasSibling?: (name: string) => boolean): boolean;
    /**
     * Evaluating the exclude expression is only async if it includes sibling clauses. As an optimization, avoid doing anything with Promises
     * unless the expression is async.
     */
    includedInQuery(testPath: string, basename?: string, hasSibling?: (name: string) => boolean | Promise<boolean>): Promise<boolean> | boolean;
    hasSiblingExcludeClauses(): boolean;
}
export declare function hasSiblingPromiseFn(siblingsFn?: () => Promise<string[]>): ((name: string) => Promise<boolean>) | undefined;
export interface SearchOptions {
    /**
     * The root folder to search within.
     */
    folder: string;
    /**
     * Files that match an `includes` glob pattern should be included in the search.
     */
    includes: string[];
    /**
     * Files that match an `excludes` glob pattern should be excluded from the search.
     */
    excludes: string[];
    /**
     * Whether external files that exclude files, like .gitignore, should be respected.
     * See the vscode setting `"search.useIgnoreFiles"`.
     */
    useIgnoreFiles: boolean;
    /**
     * Whether symlinks should be followed while searching.
     * See the vscode setting `"search.followSymlinks"`.
     */
    followSymlinks: boolean;
    /**
     * Whether global files that exclude files, like .gitignore, should be respected.
     * See the vscode setting `"search.useGlobalIgnoreFiles"`.
     */
    useGlobalIgnoreFiles: boolean;
    /**
     * Whether files in parent directories that exclude files, like .gitignore, should be respected.
     * See the vscode setting `"search.useParentIgnoreFiles"`.
     */
    useParentIgnoreFiles: boolean;
}
export interface TextSearchOptions extends SearchOptions {
    /**
     * The maximum number of results to be returned.
     */
    maxResults: number;
    /**
     * Options to specify the size of the result text preview.
     */
    previewOptions?: TextSearchPreviewOptions;
    /**
     * Exclude files larger than `maxFileSize` in bytes.
     */
    maxFileSize?: number;
    /**
     * Interpret files using this encoding.
     * See the vscode setting `"files.encoding"`
     */
    encoding?: string;
    /**
     * Number of lines of context to include before each match.
     */
    beforeContext?: number;
    /**
     * Number of lines of context to include after each match.
     */
    afterContext?: number;
    usePCRE2?: boolean;
}
export interface IFolderQuery {
    folder: string;
    folderName?: string;
    excludePattern?: glob.IExpression;
    includePattern?: glob.IExpression;
    fileEncoding?: string;
    disregardIgnoreFiles?: boolean;
    disregardGlobalIgnoreFiles?: boolean;
    disregardParentIgnoreFiles?: boolean;
    ignoreSymlinks?: boolean;
}
export declare function resolvePatternsForProvider(globalPattern: glob.IExpression | undefined, folderPattern: glob.IExpression | undefined): string[];
export interface IPatternInfo {
    pattern: string;
    isRegExp?: boolean;
    isWordMatch?: boolean;
    wordSeparators?: string;
    isMultiline?: boolean;
    isUnicode?: boolean;
    isCaseSensitive?: boolean;
}
export interface TextSearchQuery {
    /**
     * The text pattern to search for.
     */
    pattern: string;
    /**
     * Whether or not `pattern` should match multiple lines of text.
     */
    isMultiline?: boolean;
    /**
     * Whether or not `pattern` should be interpreted as a regular expression.
     */
    isRegExp?: boolean;
    /**
     * Whether or not the search should be case-sensitive.
     */
    isCaseSensitive?: boolean;
    /**
     * Whether or not to search for whole word matches only.
     */
    isWordMatch?: boolean;
}
export interface IProgress<T> {
    report(item: T): void;
}
export declare class Progress<T> implements IProgress<T> {
    private callback;
    static readonly None: Readonly<IProgress<unknown>>;
    private _value?;
    get value(): T | undefined;
    constructor(callback: (data: T) => void);
    report(item: T): void;
}
export declare enum SearchErrorCode {
    unknownEncoding = 1,
    regexParseError = 2,
    globParseError = 3,
    invalidLiteral = 4,
    rgProcessError = 5,
    other = 6,
    canceled = 7
}
export declare class SearchError extends Error {
    readonly code?: SearchErrorCode | undefined;
    constructor(message: string, code?: SearchErrorCode | undefined);
}
export declare function serializeSearchError(searchError: SearchError): Error;
export interface TextSearchPreviewOptions {
    /**
     * The maximum number of lines in the preview.
     * Only search providers that support multiline search will ever return more than one line in the match.
     */
    matchLines: number;
    /**
     * The maximum number of characters included per line.
     */
    charsPerLine: number;
}
export declare class SearchRange implements ISearchRange {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
}
export declare class OneLineRange extends SearchRange {
    constructor(lineNumber: number, startColumn: number, endColumn: number);
}
export declare class TextSearchMatch implements ITextSearchMatch {
    ranges: ISearchRange | ISearchRange[];
    preview: ITextSearchResultPreview;
    path: string;
    constructor(text: string, range: ISearchRange | ISearchRange[], previewOptions?: ITextSearchPreviewOptions);
}
/**
 * A line of context surrounding a TextSearchMatch.
 */
export interface TextSearchContext {
    path: string;
    text: string;
    lineNumber: number;
}
export interface ISearchRange {
    readonly startLineNumber: number;
    readonly startColumn: number;
    readonly endLineNumber: number;
    readonly endColumn: number;
}
interface Thenable<T> {
    /**
    * Attaches callbacks for the resolution and/or rejection of the Promise.
    * @param onfulfilled The callback to execute when the Promise is resolved.
    * @param onrejected The callback to execute when the Promise is rejected.
    * @returns A Promise for the completion of which ever callback is executed.
    */
    then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => TResult | Thenable<TResult>): Thenable<TResult>;
    then<TResult>(onfulfilled?: (value: T) => TResult | Thenable<TResult>, onrejected?: (reason: any) => void): Thenable<TResult>;
}
export {};
