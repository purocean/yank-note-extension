import { Component } from 'vue';
import type { Components } from '@fe/types';
interface Opts extends Components.FixedFloat.Props {
    component: Component;
    closeOnBlur?: boolean;
    closeOnEsc?: boolean;
    onBlur?: (byClickSelf?: boolean) => void;
    onEsc?: () => void;
}
export interface Instance {
    show: (opts: Opts) => void;
    hide: () => void;
}
/**
 * Get a fixed float instance.
 * @returns instance
 */
export declare function useFixedFloat(): Instance;
export default function install(): void;
export {};
