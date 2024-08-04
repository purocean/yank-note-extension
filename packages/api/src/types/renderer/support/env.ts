import type Remote from '@electron/remote/index';
export declare const nodeProcess: NodeJS.Process;
export declare const nodeModule: NodeModule;
export declare const nodeRequire: NodeRequire;
export declare const isElectron: boolean;
export declare const isMacOS: boolean;
export declare const isWindows: boolean;
export declare const isOtherOS: boolean;
/**
 * Open in new window.
 * @param url
 * @param target
 * @param options
 * @returns opener
 */
export declare function openWindow(url: string, target?: string, options?: Record<string, any>): Window | null;
export declare function getElectronRemote(): typeof Remote;
