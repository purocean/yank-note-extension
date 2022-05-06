import type { Components, Doc, ExportType, FileItem, PathItem } from '@fe/types';
export declare type ApiResult<T = any> = {
    status: 'ok' | 'error';
    message: string;
    data: T;
};
export declare function fetchHttp(input: RequestInfo, init?: RequestInit): Promise<any>;
/**
 * Proxy request.
 * @param url URL
 * @param reqOptions
 * @param usePost
 * @returns
 */
export declare function proxyRequest(url: string, reqOptions?: Record<string, any>, usePost?: boolean): Promise<Response>;
/**
 * Read a file.
 * @param file
 * @param asBase64
 * @returns
 */
export declare function readFile(file: PathItem, asBase64?: boolean): Promise<{
    content: any;
    hash: any;
}>;
/**
 * Write content to a file.
 * @param file
 * @param content
 * @param asBase64
 * @returns
 */
export declare function writeFile(file: Doc, content?: string, asBase64?: boolean): Promise<{
    hash: any;
}>;
/**
 * Move / Remove a file or dir.
 * @param file
 * @param newPath
 * @returns
 */
export declare function moveFile(file: FileItem, newPath: string): Promise<ApiResult<any>>;
/**
 * Delete a file or dir.
 * @param file
 * @returns
 */
export declare function deleteFile(file: FileItem): Promise<ApiResult<any>>;
export declare function fetchHistoryList(file: PathItem): Promise<{
    name: string;
    comment: string;
}[]>;
export declare function fetchHistoryContent(file: PathItem, version: string): Promise<string>;
export declare function deleteHistoryVersion(file: PathItem, version: string): Promise<any>;
export declare function commentHistoryVersion(file: PathItem, version: string, msg: string): Promise<any>;
/**
 * Fetch file tree from a repository.
 * @param repo
 * @returns
 */
export declare function fetchTree(repo: string): Promise<Components.Tree.Node[]>;
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
/**
 * Search in a repository.
 * @param repo
 * @param text
 * @returns
 */
export declare function search(repo: string, text: string): Promise<Pick<Doc, 'repo' | 'type' | 'path' | 'name'>>;
/**
 * Upload file.
 * @param repo
 * @param fileBase64Url
 * @param filePath
 */
export declare function upload(repo: string, fileBase64Url: string, filePath: string): Promise<ApiResult<any>>;
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
 * @param language
 * @param code
 * @param callback
 * @returns result (javascript no result)
 */
export declare function runCode(language: string, code: string, callback?: {
    name: string;
    handler: (res: string) => void;
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
export declare function fetchInstalledExtensions(): Promise<{
    id: string;
    enabled: boolean;
}[]>;
export declare function installExtension(id: string, url: string): Promise<any>;
export declare function uninstallExtension(id: string): Promise<any>;
export declare function enableExtension(id: string): Promise<any>;
export declare function disableExtension(id: string): Promise<any>;
