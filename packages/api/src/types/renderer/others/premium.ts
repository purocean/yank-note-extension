interface License {
    name: string;
    email: string;
    hash: string;
    activateExpires: number;
    expires: number;
}
export declare function getPurchased(force?: boolean): boolean;
export declare function showPremium(): void;
export declare function getLicenseInfo(): License | null;
export declare function setLicense(licenseStr: string): Promise<void>;
export {};
