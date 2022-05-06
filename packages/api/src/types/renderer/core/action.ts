import { BuildInActions, BuildInActionName } from '@fe/types';
export declare type ActionHandler<T extends string> = T extends BuildInActionName ? BuildInActions[T] : (...args: any[]) => any;
export declare type HookType = 'before-run' | 'after-run';
export interface Action<T extends string> {
    /**
     * Name
     */
    name: T;
    /**
     * Associate shortcuts
     */
    keys?: null | (string | number)[];
    /**
     * Handler
     */
    handler: ActionHandler<T>;
    /**
     * When should execute handler
     */
    when?: () => boolean;
}
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
