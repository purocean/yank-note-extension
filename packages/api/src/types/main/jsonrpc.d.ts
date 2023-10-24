import { JSONRPCClient } from 'jsonrpc-bridge';
declare type Ctx = {
    setting: {
        showSettingPanel: (key?: string) => void;
    };
    doc: {
        switchDocByPath: (path: string) => Promise<void>;
    };
    base: {
        triggerDeepLinkOpen: (url: string) => Promise<void>;
    };
};
export declare let jsonRPCClient: JSONRPCClient<{
    ctx: Ctx;
}>;
export declare function initJSONRPCClient(webContent: Electron.WebContents): void;
export {};
