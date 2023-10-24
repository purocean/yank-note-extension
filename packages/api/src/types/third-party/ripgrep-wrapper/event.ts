import { IDisposable } from './utils';
export interface Event<T> {
    (listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
}
export declare namespace Event {
    const None: Event<any>;
}
export declare class Listener<T> {
    readonly callback: (e: T) => void;
    readonly callbackThis: any | undefined;
    constructor(callback: (e: T) => void, callbackThis: any | undefined);
    invoke(e: T): void;
}
export declare class Emitter<T> {
    private _disposed;
    private _event?;
    private _listeners?;
    dispose(): void;
    get event(): Event<T>;
    fire(event: T): void;
}
