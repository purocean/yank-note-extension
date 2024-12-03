import { EntityTable } from 'dexie';
import type { IndexItem } from '@fe/types';
export interface DocumentEntity extends IndexItem {
    id: number;
}
export declare const documents: {
    getTable(): EntityTable<DocumentEntity, "id">;
    findByRepoAndPath(repo: string, path: string): Promise<DocumentEntity | undefined>;
    findAllMtimeMsByRepo(repo: string): Promise<Map<string, {
        id: number;
        mtimeMs: number;
    }>>;
    put(entity: Omit<DocumentEntity, "id"> & {
        id?: number;
    }): Promise<number>;
    bulkPut(items: (Omit<DocumentEntity, "id"> & {
        id?: number;
    })[]): Promise<number[]>;
    deleteByRepo(repo: string): Promise<number>;
    deleteUnusedRepo(usedRepos: string[]): Promise<number>;
    deleteUnusedInRepo(repo: string, usedIds: number[]): Promise<number>;
    deletedByRepoAndPath(repo: string, path: string): Promise<number>;
};
export declare function removeOldDatabases(): Promise<void>;
