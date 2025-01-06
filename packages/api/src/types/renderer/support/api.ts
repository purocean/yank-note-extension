import type { Stats } from 'fs';
import type { WatchOptions } from 'chokidar';
import type { IProgressMessage, ISerializedFileMatch, ISerializedSearchSuccess, ITextQuery } from 'ripgrep-wrapper';
import type { Components, Doc, ExportType, FileItem, FileReadResult, FileSort, FileStat, PathItem } from '@fe/types';
export type ApiResult<T = any> = {
    status: 'ok' | 'error';
    message: string;
    data: T;
};
export declare function fetchHttp(input: RequestInfo, init?: RequestInit): Promise<any>;
/**
 * Proxy fetch.
 * @param url RequestInfo | URL
 * @param init RequestInit
 * @returns
 */
export declare function proxyFetch(url: RequestInfo | URL, init?: Omit<RequestInit, 'body'> & {
    body?: any;
    timeout?: number;
    proxy?: string;
    jsonBody?: boolean;
}): Promise<Response>;
/**
 * Read a file.
 * @param file
 * @param asBase64
 * @returns
 */
export declare function readFile(file: PathItem, asBase64?: boolean): Promise<FileReadResult>;
/**
 * Write content to a file.
 * @param file
 * @param content
 * @param asBase64
 * @returns
 */
export declare function writeFile(file: Doc, content?: string, asBase64?: boolean): Promise<{
    hash: string;
    stat: FileStat;
}>;
/**
 * Move / Rename a file or dir.
 * @param file
 * @param newPath
 * @returns
 */
export declare function moveFile(file: FileItem, newPath: string): Promise<ApiResult<any>>;
/**
 * Copy a file
 * @param file
 * @param newPath
 * @returns
 */
export declare function copyFile(file: FileItem, newPath: string): Promise<ApiResult<any>>;
/**
 * Delete a file or dir.
 * @param file
 * @param trash Move to trash or not, default is true.
 * @returns
 */
export declare function deleteFile(file: PathItem, trash?: boolean): Promise<ApiResult<any>>;
export declare function fetchHistoryList(file: PathItem): Promise<{
    size: number;
    list: {
        name: string;
        comment: string;
    }[];
}>;
export declare function fetchHistoryContent(file: PathItem, version: string): Promise<string>;
export declare function deleteHistoryVersion(file: PathItem, version: string): Promise<any>;
export declare function commentHistoryVersion(file: PathItem, version: string, msg: string): Promise<any>;
/**
 * Fetch file tree from a repository.
 * @param repo
 * @param sort
 * @param include
 * @param noEmptyDir
 * @returns
 */
export declare function fetchTree(repo: string, sort: FileSort, include?: string, noEmptyDir?: boolean): Promise<Components.Tree.Node[]>;
/**
 * Fetch custom styles.
 * @returns
 */
export declare function fetchCustomStyles(): Promise<string[]>;
/**
 * Fetch settings.
 * @returns
 */
export declare function fetchSettings(): Promise<Record<string, any>>;
/**
 * Write settings.
 * @param data
 * @returns
 */
export declare function writeSettings(data: Record<string, any>): Promise<ApiResult<any>>;
/**
 * Launch app to choose a path.
 * @param options
 * @returns
 */
export declare function choosePath(options: Record<string, any>): Promise<{
    canceled: boolean;
    filePaths: string[];
}>;
type SearchReturn = (onResult: (result: ISerializedFileMatch[]) => void | Promise<void>, onMessage?: (message: IProgressMessage) => void | Promise<void>) => Promise<ISerializedSearchSuccess | null>;
/**
 * Search files.
 * @param controller
 * @param query
 * @returns
 */
export declare function search(controller: AbortController, query: ITextQuery): Promise<SearchReturn>;
/**
 * Watch file or dir.
 * @param controller
 * @param query
 * @returns
 */
export declare function watchFs(repo: string, path: string | string[], options: WatchOptions & {
    mdContent?: boolean;
    mdFilesOnly?: boolean;
}, onResult: (result: {
    eventName: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
    path: string;
    content?: string | null;
    stats?: Stats;
} | {
    eventName: 'ready';
}) => void, onError: (error: Error) => void): Promise<{
    result: Promise<string | null>;
    abort: () => void;
}>;
/**
 * Upload file.
 * @param repo
 * @param fileBase64Url
 * @param filePath
 * @param ifExists
 */
export declare function upload(repo: string, fileBase64Url: string, filePath: string, ifExists?: 'rename' | 'overwrite' | 'skip' | 'error'): Promise<ApiResult<{
    path: string;
    hash: string;
}>>;
/**
 * Write temporary file.
 * @param name
 * @param data
 * @param asBase64
 * @returns
 */
export declare function writeTmpFile(name: string, data: string, asBase64?: boolean): Promise<ApiResult<{
    path: string;
}>>;
/**
 * Read temporary file.
 * @param name
 * @returns
 */
export declare function readTmpFile(name: string): Promise<Response>;
/**
 * Remove temporary file.
 * @param name
 * @returns
 */
export declare function deleteTmpFile(name: string): Promise<ApiResult<any>>;
/**
 * List user dir.
 * @param name
 * @returns
 */
export declare function listUserDir(name: string, recursive?: boolean): Promise<{
    name: string;
    path: string;
    parent: string;
    isFile: boolean;
    isDir: boolean;
}[]>;
/**
 * Write user file.
 * @param name
 * @param data
 * @param asBase64
 * @returns
 */
export declare function writeUserFile(name: string, data: string, asBase64?: boolean): Promise<ApiResult<{
    path: string;
}>>;
/**
 * Read user file.
 * @param name
 * @returns
 */
export declare function readUserFile(name: string): Promise<Response>;
/**
 * Remove user file.
 * @param name
 * @returns
 */
export declare function deleteUserFile(name: string): Promise<ApiResult<any>>;
/**
 * Convert file
 * @param source
 * @param fromType
 * @param toType
 * @param resourcePath
 * @returns
 */
export declare function convertFile(source: string, fromType: 'html' | 'markdown', toType: Exclude<ExportType, 'pdf'>, resourcePath: string): Promise<Response>;
/**
 * Run code.
 * @param cmd
 * @param code
 * @param opts
 * @returns result
 */
export declare function runCode(cmd: string | {
    cmd: string;
    args: string[];
}, code: string, opts?: {
    stream?: boolean;
    signal?: AbortSignal;
}): Promise<ReadableStreamDefaultReader>;
export declare function runCode(cmd: string | {
    cmd: string;
    args: string[];
}, code: string, opts?: {
    stream?: boolean;
    signal?: AbortSignal;
}): Promise<string>;
/**
 * Eval cade on Electron main process
 *
 * await ctx.api.rpc('return 1 + 1') // result 2
 * await ctx.api.rpc(`return require('os').platform()`) // result 'darwin'
 * await ctx.api.rpc(`return require('./constant').APP_NAME`) // result 'yank-note'
 *
 * @param code Function body
 */
export declare function rpc(code: string): Promise<any>;
/**
 * Fetch installed extensions
 * @returns
 */
export declare function fetchInstalledExtensions(): Promise<{
    id: string;
    enabled: boolean;
    isDev?: boolean;
}[]>;
/**
 * Install extension
 * @param id
 * @param url
 * @returns
 */
export declare function installExtension(id: string, url: string): Promise<any>;
/**
 * Abort extension installation
 * @returns
 */
export declare function abortExtensionInstallation(): Promise<any>;
/**
 * Uninstall extension
 * @param id
 * @returns
 */
export declare function uninstallExtension(id: string): Promise<any>;
/**
 * Enable extension
 * @param id
 * @returns
 */
export declare function enableExtension(id: string): Promise<any>;
/**
 * Disable extension
 * @param id
 * @returns
 */
export declare function disableExtension(id: string): Promise<any>;
export {};
