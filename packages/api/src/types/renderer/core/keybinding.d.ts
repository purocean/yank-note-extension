import type { BuildInActions } from '@fe/types';
export declare const Escape = "Escape";
export declare const Ctrl = "Ctrl";
export declare const Meta = "Meta";
export declare const Cmd = "Cmd";
export declare const Win = "Win";
export declare const CtrlCmd = "CtrlCmd";
export declare const Alt = "Alt";
export declare const Space = "Space";
export declare const Shift = "Shift";
export declare const BracketLeft = "BracketLeft";
export declare const BracketRight = "BracketRight";
export declare const LeftClick = 0;
export declare const Tab = "Tab";
declare type XKey = typeof Ctrl | typeof CtrlCmd | typeof Alt | typeof Shift;
/**
 * Disable shortcuts
 */
export declare function disableShortcuts(): void;
/**
 * Enable shortcuts
 */
export declare function enableShortcuts(): void;
/**
 * Determine whether the user has pressed the key
 * @param key upper case.
 */
export declare function isKeydown(key: string): boolean;
/**
 * Determine whether the user has pressed the Cmd key (macOS) or Ctrl key.
 * @param e
 * @returns
 */
export declare function hasCtrlCmd(e: KeyboardEvent | MouseEvent): boolean;
/**
 * Get key label.
 * @param key
 * @returns
 */
export declare function getKeyLabel(key: XKey | string | number): string;
/**
 * Determine whether the event matches the shortcut key combination.
 * @param e
 * @param keys
 * @returns
 */
export declare function matchKeys(e: KeyboardEvent | MouseEvent, keys: (string | number)[]): boolean;
/**
 * Get shortcuts label.
 * @param idOrKeys command id or keys
 * @returns
 */
export declare function getKeysLabel(id: keyof BuildInActions): string;
export declare function getKeysLabel(id: string): string;
export declare function getKeysLabel(keys: (string | number)[]): string;
export declare function keydownHandler(e: KeyboardEvent): void;
export declare function keyupHandler(e: KeyboardEvent): void;
export {};
