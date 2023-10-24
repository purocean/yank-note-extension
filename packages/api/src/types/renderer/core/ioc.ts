import type { BuildInIOCTypes } from '@fe/types';
export declare function get<T extends keyof BuildInIOCTypes>(type: T): BuildInIOCTypes[T][];
export declare function getRaw<T extends keyof BuildInIOCTypes>(type: T): (BuildInIOCTypes[T][] & {
    _version: number;
}) | undefined;
export declare function register<T extends keyof BuildInIOCTypes>(type: T, item: BuildInIOCTypes[T]): void;
export declare function remove<T extends keyof BuildInIOCTypes>(type: T, item: BuildInIOCTypes[T]): void;
export declare function removeWhen<T extends keyof BuildInIOCTypes>(type: T, when: (item: BuildInIOCTypes[T]) => boolean): void;
export declare function removeAll<T extends keyof BuildInIOCTypes>(type: T): void;
