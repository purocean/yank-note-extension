/// <reference types="node" />
declare const server: (port?: number) => {
    callback: (req: import("http").IncomingMessage | import("http2").Http2ServerRequest, res: import("http2").Http2ServerResponse | import("http").ServerResponse<import("http").IncomingMessage>) => void;
    server?: undefined;
} | {
    callback: (req: import("http").IncomingMessage | import("http2").Http2ServerRequest, res: import("http2").Http2ServerResponse | import("http").ServerResponse<import("http").IncomingMessage>) => void;
    server: any;
};
export default server;
