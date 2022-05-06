import { App, ComponentPublicInstance } from 'vue';
import type { Components } from '@fe/types';
export interface Instance extends ComponentPublicInstance {
    show: (menuItems: Components.ContextMenu.Item[]) => void;
}
/**
 * Get ContextMenu instance
 * @returns instance
 */
export declare function useContextMenu(): Instance;
export default function install(app: App): void;
