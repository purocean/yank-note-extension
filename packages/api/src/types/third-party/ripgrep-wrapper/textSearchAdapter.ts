import { CancellationToken } from './cancellation';
import { IProgressMessage, ISerializedFileMatch, ISerializedSearchSuccess, ITextQuery, TextSearchProvider } from './search';
import { TextSearchManager } from './textSearchManager';
export declare function toCanonicalName(enc: string): string;
export declare class NativeTextSearchManager extends TextSearchManager {
    constructor(query: ITextQuery, provider: TextSearchProvider);
}
export declare class TextSearchEngineAdapter {
    private rgPath;
    private query;
    constructor(rgPath: string, query: ITextQuery);
    search(token: CancellationToken, onResult: (matches: ISerializedFileMatch[]) => void, onMessage: (message: IProgressMessage) => void): Promise<ISerializedSearchSuccess>;
}
