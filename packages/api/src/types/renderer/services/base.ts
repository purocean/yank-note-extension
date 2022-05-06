import type { Doc } from '@fe/types';
/**
 * Upload a file.
 * @param file
 * @param belongDoc belong document
 * @param name filename
 * @returns
 */
export declare function upload(file: File, belongDoc: Pick<Doc, 'repo' | 'path'>, name?: string): Promise<string>;
/**
 * Input password.
 * @param title
 * @param hint
 * @param throwError
 * @returns
 */
export declare function inputPassword(title: string, hint: string, throwError?: boolean): Promise<string>;
/**
 * open an external uri
 * @param uri
 */
export declare function openExternal(uri: string): Promise<void>;
/**
 * open a path
 * @param path
 */
export declare function openPath(path: string): Promise<void>;
/**
 * show item in folder
 * @param path
 */
export declare function showItemInFolder(path: string): Promise<void>;
/**
 * Trash item
 * @param path
 */
export declare function trashItem(path: string): Promise<void>;
/**
 * get repo by name
 * @param name
 * @returns
 */
export declare function getRepo(name: string): import("@fe/types").Repo | undefined;
export declare function readFromClipboard(): Promise<Record<string, any>>;
export declare function readFromClipboard(callback: (type: string, getType: (type: string) => Promise<Blob>) => Promise<void>): Promise<void>;
export declare function writeToClipboard(type: string, value: any): Promise<any>;
