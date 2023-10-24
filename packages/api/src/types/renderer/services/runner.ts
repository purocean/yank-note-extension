import type { CodeRunner } from '@fe/types';
/**
 * Register a runner.
 * @param runner
 */
export declare function registerRunner(runner: CodeRunner): void;
/**
 * Remove a runner.
 * @param name runner name
 */
export declare function removeRunner(name: string): void;
/**
 * Get all runners.
 * @returns runners
 */
export declare function getAllRunners(): CodeRunner[];
