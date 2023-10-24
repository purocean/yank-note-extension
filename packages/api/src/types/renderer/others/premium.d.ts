import { LicenseToken } from 'app-license';
import type { PremiumTab } from '@fe/types';
declare type Payload = {
    fetchToken: {
        licenseId: string;
    };
    removeDevice: {
        licenseId: string;
        device: string;
    };
    addDevice: {
        licenseId: string;
    };
    fetchDevices: {
        licenseId: string;
    };
    upgradeLicense: {
        oldLicense: string;
        locale: string;
    };
    checkDevice: {
        device: string;
    };
    genDeviceString: {};
};
export declare function requestApi<T extends keyof Payload>(method: T, payload: Payload[T]): Promise<any>;
export declare function tokenAvailableDays(token: LicenseToken): number;
export declare function tokenIsExpiredSoon(token: LicenseToken): boolean;
export declare function tokenIsStaleSoon(token: LicenseToken): boolean;
export declare function getPurchased(force?: boolean): boolean;
export declare function showPremium(tab?: PremiumTab): void;
export declare function getLicenseToken(): LicenseToken | null;
export declare function cleanLicense(): Promise<void>;
export declare function refreshLicense(opts?: {
    throwError?: boolean;
}): Promise<void>;
export declare function activateLicense(licenseId: string): Promise<void>;
export declare function activateByTokenString(tokenString: string): Promise<void>;
export {};
