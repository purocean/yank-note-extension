export * as path from './path';
export * as storage from './storage';
export * as crypto from './crypto';
export * as composable from './composable';
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
export declare function downloadContent(filename: string, content: Blob): void;
export declare function downloadContent(filename: string, content: ArrayBuffer | Buffer | string, type: string): void;
export declare function downloadDataURL(filename: string, dataURL: string): void;
export declare function md5(content: any): string;
export declare function binMd5(data: any): string;
export declare function strToBase64(str: string): string;
export declare function copyText(text?: string): void;
/**
 * Wait until condition is true
 * @param fn
 * @param interval
 * @param timeout
 */
export declare function waitCondition(fn: () => boolean | Promise<boolean>, interval?: number, timeout?: number): (Promise<void> | {
    cancel: () => void;
});
