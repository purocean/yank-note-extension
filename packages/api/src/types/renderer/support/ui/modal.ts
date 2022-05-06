import { App, ComponentPublicInstance } from 'vue';
import type { Components } from '@fe/types';
export interface Instance extends ComponentPublicInstance {
    alert: (params: Components.Modal.AlertModalParams) => Promise<boolean>;
    confirm: (params: Components.Modal.ConfirmModalParams) => Promise<boolean>;
    input: (params: Components.Modal.InputModalParams) => Promise<string | null>;
    cancel: () => void;
    ok: () => void;
}
/**
 * Get Modal instance.
 * @returns instance
 */
export declare function useModal(): Instance;
export default function install(app: App): void;
