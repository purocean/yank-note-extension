import type { Action, ActionHandler, BuildInActionName } from '@fe/types';
export declare type HookType = 'before-run' | 'after-run';
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
