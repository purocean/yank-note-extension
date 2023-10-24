import { CancellationToken } from './cancellation';
import { IFileMatch, ISerializedSearchSuccess, ITextQuery, ITextSearchMatch, ITextSearchResult, TextSearchProvider } from './search';
export interface IFileUtils {
    readdir: (path: string) => Promise<string[]>;
    toCanonicalName: (encoding: string) => string;
}
export declare class TextSearchManager {
    private query;
    private provider;
    private fileUtils;
    private collector;
    private isLimitHit;
    private resultCount;
    constructor(query: ITextQuery, provider: TextSearchProvider, fileUtils: IFileUtils);
    search(onProgress: (matches: IFileMatch[]) => void, token: CancellationToken): Promise<ISerializedSearchSuccess>;
    private resultSize;
    private trimResultToSize;
    private searchInFolder;
    private validateProviderResult;
    private getSearchOptionsForFolder;
}
export declare class TextSearchResultsCollector {
    private _onResult;
    private _batchedCollector;
    private _currentFolderIdx;
    private _currentFileMatch;
    constructor(_onResult: (result: IFileMatch[]) => void);
    add(data: ITextSearchResult, folderIdx: number): void;
    private pushToCollector;
    flush(): void;
    private sendItems;
}
export declare function extensionResultIsMatch(data: ITextSearchResult): data is ITextSearchMatch;
/**
 * Collects items that have a size - before the cumulative size of collected items reaches START_BATCH_AFTER_COUNT, the callback is called for every
 * set of items collected.
 * But after that point, the callback is called with batches of maxBatchSize.
 * If the batch isn't filled within some time, the callback is also called.
 */
export declare class BatchedCollector<T> {
    private maxBatchSize;
    private cb;
    private static readonly TIMEOUT;
    private static readonly START_BATCH_AFTER_COUNT;
    private totalNumberCompleted;
    private batch;
    private batchSize;
    private timeoutHandle;
    constructor(maxBatchSize: number, cb: (items: T[]) => void);
    addItem(item: T, size: number): void;
    addItems(items: T[], size: number): void;
    private addItemToBatch;
    private addItemsToBatch;
    private onUpdate;
    flush(): void;
}
