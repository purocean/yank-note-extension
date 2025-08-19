import type { BaseDoc, PositionState } from '@fe/types';
/**
 * Change position.
 * @param position
 */
export declare function changePosition(position: PositionState): Promise<void>;
/**
 *  Choose a document.
 * @param filter
 * @returns
 */
export declare function chooseDocument(filter?: (item: BaseDoc) => boolean): Promise<BaseDoc | null>;
