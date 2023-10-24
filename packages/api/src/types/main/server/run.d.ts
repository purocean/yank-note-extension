/// <reference types="node" />
declare const _default: {
    runCode: (cmd: string | {
        cmd: string;
        args: string[];
    }, code: string) => Promise<string | NodeJS.ReadableStream>;
};
export default _default;
