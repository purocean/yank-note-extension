import type { Repo } from '@fe/types';
/**
 * Get all repositories
 * @returns
 */
export declare function getAllRepos(): Repo[];
/**
 * get repo by name
 * @param name
 * @returns
 */
export declare function getRepo(name: string): Repo | undefined;
/**
 * Set current repository
 * @param name
 */
export declare function setCurrentRepo(name?: string): void;
/**
 * enable or disable repo indexing
 */
export declare function toggleRepoIndexing(name: string, enable: boolean): Promise<void>;
/**
 * Check if the repo is normal
 * @param name
 * @returns
 */
export declare function isNormalRepo(nameOrRepo: string | Repo): boolean;
