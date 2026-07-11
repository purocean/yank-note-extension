import type { Action, ActionHandler, BuildInActionName } from '@fe/types';
export type HookType = 'before-run' | 'after-run';
/**
 * Get all actions
 * @returns all actions
 */
export declare function getRawActions(): Action[];
/**
 * Register a action tapper.
 * @param tapper
 */
export declare function tapAction(tapper: (action: Action) => void): void;
/**
 * Remove a action tapper.
 * @param tapper
 */
export declare function removeActionTapper(tapper: (action: Action) => void): void;
/**
 * Register an action.
 * @param action
 * @returns action
 */
export declare function registerAction<T extends string>(action: Action<T>): Action<T>;
/**
 * Get an action handler.
 * @param name
 */
export declare function getActionHandler<T extends BuildInActionName>(name: T): ActionHandler<T>;
export declare function getActionHandler<T extends string>(name: T): ActionHandler<T>;
/**
 * Execute an action directly by name with arguments.
 * This is used for RPC calls where functions cannot be passed.
 * @param name Action name
 * @param args Arguments to pass to the action
 * @returns Result of the action execution
 */
export declare function executeAction<T extends BuildInActionName>(name: T, ...args: Parameters<ActionHandler<T>>): ReturnType<ActionHandler<T>>;
export declare function executeAction<T extends string>(name: T, ...args: Parameters<ActionHandler<T>>): ReturnType<ActionHandler<T>>;
/**
 * Get an action.
 * @param name
 */
export declare function getAction<T extends BuildInActionName>(name: T): Action<T> | undefined;
export declare function getAction<T extends string>(name: T): Action<T> | undefined;
/**
 * Remove an action.
 * @param name
 */
export declare function removeAction(name: BuildInActionName): void;
export declare function removeAction(name: string): void;
