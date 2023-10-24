/// <reference types="node" />
import { ITextQuery } from 'ripgrep-wrapper';
export declare function search(query: ITextQuery): Promise<import("stream").Readable>;
