import type { Extension, ExtensionCompatible, ExtensionLoadStatus, RegistryHostname } from '@fe/types';
export declare const registries: RegistryHostname[];
export declare function getExtensionPath(id: string, ...paths: string[]): string;
export declare function getInstalledExtensionFileUrl(id: string, filename: string): string;
export declare function getLoadStatus(id: string): ExtensionLoadStatus;
export declare function getCompatible(engines?: {
    'yank-note': string;
}): ExtensionCompatible;
export declare function readInfoFromJson(json: any): Omit<Extension, 'installed'> | null;
export declare function getInstalledExtension(id: string): Promise<Extension | null>;
export declare function getInstalledExtensions(): Promise<Extension[]>;
export declare function getRegistryExtensions(registry?: RegistryHostname): Promise<Extension[]>;
export declare function showManager(id?: string): void;
export declare function enable(extension: Extension): Promise<void>;
export declare function disable(extension: Pick<Extension, 'id'>): Promise<void>;
export declare function uninstall(extension: Pick<Extension, 'id'>): Promise<void>;
export declare function install(extension: Extension, registry?: RegistryHostname): Promise<void>;
export declare function getInitialized(): boolean;
/**
 * Initialization extension system
 */
export declare function init(): Promise<void>;
