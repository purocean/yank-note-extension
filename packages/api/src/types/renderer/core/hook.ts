import type { BuildInHookTypes } from '@fe/types';
export declare type HookType = keyof BuildInHookTypes;
export declare type HookFun<T> = (arg: T) => (boolean | void | Promise<boolean | void>);
export declare type Hook<T> = {
    fun: HookFun<T>;
    once: boolean;
};
export declare type HookTypeWithoutPayload = {
    [K in keyof BuildInHookTypes]: BuildInHookTypes[K] extends never ? K : never;
}[keyof BuildInHookTypes];
export declare type HookTypeWithPayload = keyof Omit<BuildInHookTypes, HookTypeWithoutPayload>;
/**
 * Register a hook.
 * @param type
 * @param fun
 * @param once
 */
export declare function registerHook<T extends HookType>(type: T, fun: HookFun<BuildInHookTypes[T]>, once?: boolean): void;
/**
 * Remove a hook.
 * @param type
 * @param fun
 */
export declare function removeHook<T extends HookType>(type: T, fun: HookFun<BuildInHookTypes[T]>): void;
/**
 * Trigger a hook.
 * @param type
 * @param arg
 * @returns
 */
export declare function triggerHook<T extends HookTypeWithoutPayload>(type: T): Promise<void>;
export declare function triggerHook<T extends HookTypeWithoutPayload>(type: T, arg: undefined, options: {
    breakable: true;
}): Promise<void>;
export declare function triggerHook<T extends HookTypeWithPayload>(type: T, arg: BuildInHookTypes[T]): Promise<void>;
export declare function triggerHook<T extends HookTypeWithPayload>(type: T, arg: BuildInHookTypes[T], options: {
    breakable: true;
    ignoreError?: boolean;
}): Promise<boolean>;
export declare function triggerHook<T extends HookTypeWithPayload>(type: T, arg: BuildInHookTypes[T], options?: {
    breakable?: false;
    ignoreError?: boolean;
}): Promise<void>;
