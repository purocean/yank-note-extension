import type * as Monaco from 'monaco-editor';
declare let monaco: typeof Monaco;
declare let editor: Monaco.editor.IStandaloneCodeEditor;
/**
 * Get default editor options.
 */
export declare const getDefaultOptions: () => Monaco.editor.IStandaloneEditorConstructionOptions;
/**
 * Get Monaco
 * @returns Monaco
 */
export declare function getMonaco(): typeof Monaco;
/**
 * Get editor instance.
 * @returns
 */
export declare function getEditor(): Monaco.editor.IStandaloneCodeEditor;
/**
 * Highlight given line.
 * @param line
 * @returns dispose function
 */
export declare function highlightLine(line: number): () => string[];
/**
 * Get one indent
 * getOneIndent removed https://github.com/microsoft/monaco-editor/issues/1565
 * @returns
 */
export declare function getOneIndent(): string;
/**
 * Ensure editor is ready.
 * @returns
 */
export declare function whenEditorReady(): Promise<{
    editor: typeof editor;
    monaco: typeof monaco;
}>;
/**
 * Insert text at current cursor.
 * @param text
 */
export declare function insert(text: string): void;
/**
 * Insert text at position.
 * @param position
 * @param text
 */
export declare function insertAt(position: Monaco.Position, text: string): void;
/**
 * Replace text value of line.
 * @param line
 * @param text
 */
export declare function replaceLine(line: number, text: string): void;
/**
 * Replace text value of lines.
 * @param lineStart
 * @param lineEnd
 * @param text
 */
export declare function replaceLines(lineStart: number, lineEnd: number, text: string): void;
export declare function deleteLine(line: number): void;
/**
 * Get content of line.
 * @param line
 * @returns
 */
export declare function getLineContent(line: number): string;
/**
 * Get content of lines.
 * @param lineStart
 * @param lineEnd
 * @returns
 */
export declare function getLinesContent(lineStart: number, lineEnd: number): string;
/**
 * Get text value.
 * @returns
 */
export declare function getValue(): string;
/**
 * Set text value to editor
 * @param text
 */
export declare function setValue(text: string): void;
/**
 * Replace text value.
 * @param search
 * @param val
 * @param replaceAll
 */
export declare function replaceValue(search: string | RegExp, val: string, replaceAll?: boolean): void;
/**
 * Get editor selection.
 * @returns
 */
export declare function getSelectionInfo(): {
    line: number;
    column: number;
    lineCount: number;
    textLength: number;
    selectedLength: number;
};
/**
 * Toggle editor word wrap.
 */
export declare function toggleWrap(): void;
export declare function toggleTypewriterMode(): void;
export {};
