import { IframeHTMLAttributes, PropType } from 'vue';
type BuildSrcOpts = {
    id?: string;
    globalStyle?: boolean;
    triggerParentKeyBoardEvent?: boolean;
};
/**
 * Build embedded page uri.
 * @param html
 * @param title
 * @param globalStyle/opts
 * @returns src
 */
export declare function buildSrc(html: string, title?: string, opts?: boolean): string;
export declare function buildSrc(html: string, title?: string, opts?: BuildSrcOpts): string;
export declare const IFrame: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    debounce: {
        type: NumberConstructor;
        default: number;
    };
    globalStyle: {
        type: BooleanConstructor;
        default: boolean;
    };
    triggerParentKeyBoardEvent: {
        type: BooleanConstructor;
        default: boolean;
    };
    html: StringConstructor;
    iframeProps: PropType<IframeHTMLAttributes>;
    onLoad: PropType<(iframe: HTMLIFrameElement) => void>;
}>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
    [key: string]: any;
}> | null, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    debounce: {
        type: NumberConstructor;
        default: number;
    };
    globalStyle: {
        type: BooleanConstructor;
        default: boolean;
    };
    triggerParentKeyBoardEvent: {
        type: BooleanConstructor;
        default: boolean;
    };
    html: StringConstructor;
    iframeProps: PropType<IframeHTMLAttributes>;
    onLoad: PropType<(iframe: HTMLIFrameElement) => void>;
}>> & Readonly<{}>, {
    triggerParentKeyBoardEvent: boolean;
    globalStyle: boolean;
    debounce: number;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export {};
