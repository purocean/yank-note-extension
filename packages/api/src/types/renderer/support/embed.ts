import { IframeHTMLAttributes, PropType } from 'vue';
/**
 * Build embedded page uri.
 * @param html
 * @param title
 * @param globalStyle
 * @returns src
 */
export declare function buildSrc(html: string, title?: string, globalStyle?: boolean): string;
export declare const IFrame: import("vue").DefineComponent<{
    debounce: {
        type: NumberConstructor;
        default: number;
    };
    globalStyle: {
        type: BooleanConstructor;
        default: boolean;
    };
    html: StringConstructor;
    iframeProps: PropType<IframeHTMLAttributes>;
    onLoad: PropType<(iframe: HTMLIFrameElement) => void>;
}, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}> | null, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, Record<string, any>, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<{
    debounce?: unknown;
    globalStyle?: unknown;
    html?: unknown;
    iframeProps?: unknown;
    onLoad?: unknown;
} & {
    debounce: number;
    globalStyle: boolean;
} & {
    html?: string | undefined;
    onLoad?: ((iframe: HTMLIFrameElement) => void) | undefined;
    iframeProps?: IframeHTMLAttributes | undefined;
}>, {
    debounce: number;
    globalStyle: boolean;
}>;
