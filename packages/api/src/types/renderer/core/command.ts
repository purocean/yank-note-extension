export declare const Escape = "Escape";
export declare const Ctrl = "Ctrl";
export declare const Meta = "Meta";
export declare const CtrlCmd = "CtrlCmd";
export declare const Alt = "Alt";
export declare const Space = "Space";
export declare const Shift = "Shift";
export declare const BracketLeft = "BracketLeft";
export declare const BracketRight = "BracketRight";
export declare const LeftClick = 0;
declare type XKey = typeof Ctrl | typeof CtrlCmd | typeof Alt | typeof Shift;
export interface Command {
    /**
     * Command Id
     */
    id: string;
    /**
     * Associate shortcuts
     */
    keys: null | (string | number)[];
    /**
     * Handler
     */
    handler: null | string | (() => void);
    /**
     * When should execute handler
     */
    when?: () => boolean;
}
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
 * Get a command
 * @param id
 * @returns
 */
export declare function getCommand(id: string): Command | undefined;
/**
 * Determine whether the event shortcut key combination matches a command.
 * @param e
 * @param id
 * @returns
 */
export declare function isCommand(e: KeyboardEvent | MouseEvent, id: string): boolean;
/**
 * Run a command
 * @param command
 * @returns
 */
export declare function runCommand(command: Command): any;
/**
 * Get shortcuts label.
 * @param idOrKeys command id or keys
 * @returns
 */
export declare function getKeysLabel(id: string): string;
export declare function getKeysLabel(keys: (string | number)[]): string;
/**
 * Register a command.
 * @param command
 * @returns
 */
export declare function registerCommand(command: Command): Command;
/**
 * Remove a command
 * @param id
 */
export declare function removeCommand(id: string): void;
export {};
