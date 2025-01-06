import type { Repo } from '@share/types';
import ctx from '@fe/context';
import type { IndexStatus } from '@fe/types';
export type IndexerHostExports = {
    ctx: typeof ctx;
};
export declare function getDocumentsManager(): {
    getTable(): import("dexie").EntityTable<import("@fe/others/db").DocumentEntity, "id">;
    findByRepoAndPath(repo: string, path: string): Promise<import("@fe/others/db").DocumentEntity | undefined>;
    findAllMtimeMsByRepo(repo: string): Promise<Map<string, {
        id: number;
        mtimeMs: number;
    }>>;
    put(entity: Omit<import("@fe/others/db").DocumentEntity, "id"> & {
        id?: number;
    }): Promise<number>;
    bulkPut(items: (Omit<import("@fe/others/db").DocumentEntity, "id"> & {
        id?: number;
    })[]): Promise<number[]>;
    deleteByRepo(repo: string): Promise<number>;
    deleteUnusedRepo(usedRepos: string[]): Promise<number>;
    deleteUnusedInRepo(repo: string, usedIds: number[]): Promise<number>;
    deletedByRepoAndPath(repo: string, path: string): Promise<number>;
};
export declare function stopWatch(): void;
export declare function cleanCurrentRepo(): Promise<void>;
export declare function cleanUnusedRepo(): void;
export declare function triggerWatchCurrentRepo(): void;
export declare function rebuildCurrentRepo(): Promise<void>;
export declare function updateIndexStatus(repo: Repo, status: IndexStatus): void;
export declare function importScriptsToWorker(urlOrCode: string | URL, isCode?: boolean): Promise<void>;
