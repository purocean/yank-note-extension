import MarkdownIt from 'markdown-it';
import { JSONRPCClient } from 'jsonrpc-bridge';
import * as utils from '@fe/utils/pure';
import type { Repo } from '@share/types';
import type { IndexerHostExports } from '@fe/services/indexer';
import { registerHook, removeHook } from '@fe/core/hook';
declare const exportMain: {
    triggerWatchRepo: typeof triggerWatchRepo;
    stopWatch: typeof stopWatch;
    importScripts: (urlOrCode: string, isCode?: boolean) => Promise<void>;
};
export type IndexerWorkerExports = {
    main: typeof exportMain;
};
export interface IndexerWorkerCtx {
    markdown: MarkdownIt;
    bridgeClient: JSONRPCClient<IndexerHostExports>;
    registerHook: typeof registerHook;
    removeHook: typeof removeHook;
    utils: typeof utils;
}
declare function triggerWatchRepo(repo: Repo | null | undefined): void;
declare function stopWatch(): void;
export {};
