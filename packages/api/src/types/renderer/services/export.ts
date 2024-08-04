import type { ConvertOpts, PrintOpts } from '@fe/types';
/**
 * Toggle export panel visible.
 * @param visible
 */
export declare function toggleExportPanel(visible?: boolean): void;
/**
 * Print current document.
 */
export declare function printCurrentDocument(): Promise<void>;
/**
 * Print current document to PDF.
 * @param opts
 * @returns
 */
export declare function printCurrentDocumentToPDF(opts?: PrintOpts): Promise<Buffer>;
/**
 * Convert current document.
 * @returns
 */
export declare function convertCurrentDocument(opts: ConvertOpts): Promise<Blob>;
