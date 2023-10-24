import type * as Monaco from 'monaco-editor';
import type { Ctx, Plugin } from '@fe/context';
export declare class MdFoldingProvider implements Monaco.languages.FoldingRangeProvider {
    private readonly monaco;
    private readonly ctx;
    constructor(monaco: typeof Monaco, ctx: Ctx);
    provideFoldingRanges(model: Monaco.editor.ITextModel, _context: Monaco.languages.FoldingContext, cancellationToken: Monaco.CancellationToken, retry?: boolean): Promise<Monaco.languages.FoldingRange[]>;
    private getHeaderFoldingRanges;
    private getRealLine;
    private getBlockFoldingRanges;
    private getFoldingRangeKind;
    private buildToc;
    private isFoldableToken;
}
declare const _default: Plugin;
export default _default;
