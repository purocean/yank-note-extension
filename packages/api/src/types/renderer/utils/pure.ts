export * as path from './path';
/**
 * quote string
 * @param str
 * @param quote
 */
export declare function quote(str: string, quote?: string): string;
export declare function encodeMarkdownLink(path: string): string;
export declare function escapeMd(str: string): string;
export declare function removeQuery(url: string): string;
export declare function dataURLtoBlob(dataURL: string): Blob;
export declare function fileToBase64URL(file: File | Blob): Promise<string>;
export declare function getLogger(subject: string): {
    debug: (...args: any) => void;
    log: (...args: any) => void;
    info: (...args: any) => void;
    warn: (...args: any) => void;
    error: (...args: any) => void;
};
export declare function sleep(ms: number): Promise<unknown>;
export declare function objectInsertAfterKey(obj: {}, key: string, content: {}): {
    [k: string]: unknown;
};
/**
 * Wait until condition is true
 * @param fn
 * @param interval
 * @param timeout
 */
export declare function waitCondition(fn: () => boolean | Promise<boolean>, interval?: number, timeout?: number): (Promise<void> | {
    cancel: () => void;
});
