export declare function dirnameToId(dirname: string): string;
export declare function list(): Promise<{
    id: string;
    enabled: any;
    isDev: boolean;
}[]>;
export declare function install(id: string, url: string): Promise<unknown>;
export declare function abortInstallation(): Promise<void>;
export declare function uninstall(id: string): Promise<void>;
export declare function enable(id: string): Promise<void>;
export declare function disable(id: string): Promise<void>;
