import { App, ComponentPublicInstance } from 'vue';
import { Components } from '@fe/types';
export interface Instance extends ComponentPublicInstance {
    show: (type: Components.Toast.ToastType, content: string, timeout?: number) => void;
    hide: () => void;
}
/**
 * Get toast instance.
 * @returns instance
 */
export declare function useToast(): Instance;
export default function install(app: App): void;
