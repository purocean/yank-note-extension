import type { RegistryHostname } from '@fe/types';
export declare type Compatible = {
    value: boolean;
    reason: string;
};
export declare type LoadStatus = {
    version?: string;
    themes: boolean;
    plugin: boolean;
};
export interface Extension {
    id: string;
    displayName: string;
    description: string;
    icon: string;
    homepage: string;
    license: string;
    author: {
        name: string;
        email?: string;
        url?: string;
    };
    version: string;
    themes: {
        name: string;
        css: string;
    }[];
    compatible: Compatible;
    main: string;
    enabled?: boolean;
    installed: boolean;
    origin: 'official' | 'registry' | 'unknown';
    dist: {
        tarball: string;
        unpackedSize: number;
    };
}
export declare const registries: RegistryHostname[];
export declare function getLoadStatus(id: string): LoadStatus;
export declare function getCompatible(engines?: {
    'yank-note': string;
}): Compatible;
export declare function readInfoFromJson(json: any): Omit<Extension, 'installed'> | null;
export declare function getInstalledExtension(id: string): Promise<Extension | null>;
export declare function getInstalledExtensions(): Promise<Extension[]>;
export declare function getRegistryExtensions(registry?: RegistryHostname): Promise<Extension[]>;
export declare function showManager(id?: string): void;
export declare function enable(extension: Extension): Promise<void>;
export declare function disable(extension: Pick<Extension, 'id'>): Promise<void>;
export declare function uninstall(extension: Pick<Extension, 'id'>): Promise<void>;
export declare function install(extension: Extension, registry?: RegistryHostname): Promise<void>;
/**
 * Initialization extension system
 */
export declare function init(): Promise<void>;
