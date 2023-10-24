/// <reference types="node" />
import { ProtocolRequest } from 'electron';
import { IncomingMessage, ServerResponse } from 'http';
import { Transform } from 'stream';
export declare function transformProtocolRequest(request: ProtocolRequest): Promise<{
    req: IncomingMessage;
    res: ServerResponse<IncomingMessage>;
    out: Transform;
}>;
