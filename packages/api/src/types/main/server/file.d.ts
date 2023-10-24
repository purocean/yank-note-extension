/// <reference types="node" />
import chokidar from 'chokidar';
interface XFile {
    name: string;
    path: string;
    type: 'dir' | 'file';
    repo: string;
}
interface TreeItem extends XFile {
    mtime?: number;
    birthtime?: number;
    children?: XFile[];
    level: number;
}
declare type Order = {
    by: 'mtime' | 'birthtime' | 'name' | 'serial';
    order: 'asc' | 'desc';
};
export declare function read(repo: string, p: string): Promise<Buffer>;
export declare function stat(repo: string, p: string): Promise<{
    birthtime: number;
    mtime: number;
    size: number;
}>;
export declare function write(repo: string, p: string, content: any): Promise<string>;
export declare function rm(repo: string, p: string): Promise<void>;
export declare function mv(repo: string, oldPath: string, newPath: string): Promise<void>;
export declare function cp(repo: string, oldPath: string, newPath: string): Promise<void>;
export declare function exists(repo: string, p: string): Promise<boolean>;
export declare function hash(repo: string, p: string): Promise<string>;
export declare function checkHash(repo: string, p: string, oldHash: string): Promise<boolean>;
export declare function upload(repo: string, buffer: Buffer, path: string): Promise<void>;
export declare function tree(repo: string, order: Order): Promise<TreeItem[]>;
export declare function search(repo: string, str: string): Promise<TreeItem[]>;
export declare function historyList(repo: string, path: string): Promise<{
    list: {
        name: string;
        comment: string;
    }[];
    size: number;
}>;
export declare function historyContent(repo: string, path: string, version: string): Promise<string>;
export declare function deleteHistoryVersion(repo: string, p: string, version: string): Promise<void>;
export declare function commentHistoryVersion(repo: string, p: string, version: string, msg: string): Promise<void>;
export declare function watchFile(repo: string, p: string, options: chokidar.WatchOptions): Promise<import("stream").Readable>;
export {};
