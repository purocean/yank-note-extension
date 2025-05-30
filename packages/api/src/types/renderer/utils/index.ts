export * as storage from './storage';
export * as crypto from './crypto';
export * as composable from './composable';
export * from './pure';
export declare function downloadContent(filename: string, content: Blob): void;
export declare function downloadContent(filename: string, content: ArrayBuffer | Buffer | string, type: string): void;
export declare function downloadDataURL(filename: string, dataURL: string): void;
export declare function md5(content: any): string;
export declare function binMd5(data: any): string;
export declare function strToBase64(str: string): string;
export declare function copyText(text?: string): void;
