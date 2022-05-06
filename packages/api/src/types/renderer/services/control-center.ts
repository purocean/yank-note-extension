export declare type Item = {
    type: 'btn';
    flat?: boolean;
    checked?: boolean;
    disabled?: boolean;
    icon: string;
    title: string;
    onClick?: () => void;
    showInActionBar?: boolean;
};
export declare type SchemaItem = {
    items: Item[];
};
export declare type Schema = {
    [category: string]: SchemaItem | undefined;
} & {
    switch: SchemaItem;
    navigation: SchemaItem;
};
export declare type SchemaTapper = (schema: Schema) => void;
/**
 * Refresh control center.
 */
export declare function refresh(): void;
/**
 * Add a schema processor.
 * @param tapper
 */
export declare function tapSchema(tapper: SchemaTapper): void;
/**
 * Get schema.
 * @returns
 */
export declare function getSchema(): Schema;
/**
 * Toggle visible
 * @param visible
 */
export declare function toggle(visible?: boolean): void;
