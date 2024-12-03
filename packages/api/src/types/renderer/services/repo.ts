/**
 * Get all repositories
 * @returns
 */
export declare function getAllRepos(): import("../types").Repo[];
/**
 * get repo by name
 * @param name
 * @returns
 */
export declare function getRepo(name: string): import("../types").Repo | undefined;
/**
 * Set current repository
 * @param name
 */
export declare function setCurrentRepo(name?: string): void;
/**
 * enable or disable repo indexing
 */
export declare function toggleRepoIndexing(name: string, enable: boolean): Promise<void>;
