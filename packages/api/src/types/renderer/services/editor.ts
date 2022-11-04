import type * as Monaco from 'monaco-editor';
import { CustomEditor } from '@fe/types';
export declare type SimpleCompletionItem = {
    label: string;
    kind?: Monaco.languages.CompletionItemKind;
    insertText: string;
};
export declare type SimpleCompletionItemTappers = (items: SimpleCompletionItem[]) => void;
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
 * @param reveal
 * @param duration
 * @returns dispose function
 */
export declare function highlightLine(line: number | [number, number], reveal: boolean, duration: number): Promise<void>;
export declare function highlightLine(line: number | [number, number], reveal?: boolean, duration?: number): (() => string[]) | Promise<void>;
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
    selectedLines: number;
    selectionCount: number;
};
/**
 * Toggle editor word wrap.
 */
export declare function toggleWrap(): void;
/**
 * Toggle typewriter mode.
 */
export declare function toggleTypewriterMode(): void;
/**
 * Register a simple completion item processor.
 * @param tapper
 */
export declare function tapSimpleCompletionItems(tapper: (items: SimpleCompletionItem[]) => void): void;
/**
 * Get simple completion items.
 * @returns
 */
export declare function getSimpleCompletionItems(): SimpleCompletionItem[];
/**
 * Register a markdown monarch language processor.
 * @param tapper
 */
export declare function tapMarkdownMonarchLanguage(tapper: (mdLanguage: any) => void): void;
/**
 * Get markdown monarch language.
 * @returns
 */
export declare function getMarkdownMonarchLanguage(): any;
/**
 * Switch current editor
 * @param name Editor name
 */
export declare function switchEditor(name: string): void;
/**
 * Register a custom editor.
 * @param editor Editor
 */
export declare function registerCustomEditor(editor: CustomEditor): void;
/**
 * Remove a custom editor.
 * @param name Editor name
 */
export declare function removeCustomEditor(name: string): void;
/**
 * Get all custom editors.
 * @returns Editors
 */
export declare function getAllCustomEditors(): CustomEditor[];
export {};
