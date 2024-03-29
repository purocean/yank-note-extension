/**
 * A value that is resolved synchronously when it is first needed.
 */
export interface Lazy<T> {
    hasValue(): boolean;
    getValue(): T;
    map<R>(f: (x: T) => R): Lazy<R>;
}
export declare class Lazy<T> {
    private readonly executor;
    private _didRun;
    private _value?;
    private _error;
    constructor(executor: () => T);
    /**
     * Get the wrapped value without forcing evaluation.
     */
    get rawValue(): T | undefined;
}
