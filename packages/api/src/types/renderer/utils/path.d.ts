export declare const extname: (path: string) => string, join: (...paths: string[]) => string;
export declare function normalizeSep(p: string): string;
export declare function dirname(p: string): string;
export declare function basename(p: string, ext?: string): string;
export declare function resolve(...args: string[]): string;
export declare function relative(from: string, to: string): string;
export declare function isBelongTo(path: string, sub: string): boolean;
