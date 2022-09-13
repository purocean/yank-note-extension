import type { Components } from '@fe/types';
interface Opts extends Components.QuickFilter.Props {
    onInput?: (keyword: string) => void;
    onChoose?: (item: Components.QuickFilter.Item) => void;
}
export interface Instance {
    show: (opts: Opts) => void;
    hide: () => void;
}
/**
 * Get a quick filter instance.
 * @returns instance
 */
export declare function useQuickFilter(): Instance;
export default function install(): void;
export {};
