export declare function fetchApi(url: string, payload: any): Promise<unknown>;
export declare function fetchToken(payload: {
    licenseId: string;
}): Promise<string>;
export declare function removeDevice(payload: {
    licenseId: string;
    device: string;
}): Promise<void>;
export declare function addDevice(payload: {
    licenseId: string;
}): Promise<void>;
export declare function fetchDevices(payload: {
    licenseId: string;
}): Promise<string[]>;
export declare function upgradeLicense(payload: {
    oldLicense: string;
    locale: string;
}): Promise<unknown>;
export declare function checkDevice(payload: {
    device: string;
}): Promise<void>;
export declare function genDeviceString(): Promise<string>;
