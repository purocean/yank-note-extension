/// <reference types="node" />
import { PassThrough, Readable } from 'stream';
export declare const convertAppPath: (path: string) => string;
export declare function mergeStreams(streams: NodeJS.ReadableStream[]): PassThrough;
export declare function createStreamResponse(isCanceled?: () => boolean): {
    response: Readable;
    close: () => void;
    enqueue: <T extends "result" | "message" | "done" | "error" | "null">(type: T, payload: any) => void;
};
