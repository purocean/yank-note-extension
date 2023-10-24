export declare function get<T>(key: string): T | undefined;
export declare function get<T>(key: string, defaultValue: T): T;
export declare function set(key: string, value: any): void;
export declare function remove(key: string): void;
export declare function getAll(): Storage;
export declare function clear(): void;
