import { MsgPath } from '@share/i18n';
import { BuildInSettings, SettingGroup } from '@fe/types';
export declare type TTitle = keyof {
    [K in MsgPath as `T_${K}`]: never;
};
export declare type Schema = {
    type: string;
    title: TTitle;
    properties: {
        [K in keyof BuildInSettings]: {
            type: string;
            title: TTitle;
            description?: TTitle;
            required?: boolean;
            defaultValue: BuildInSettings[K] extends any ? BuildInSettings[K] : any;
            enum?: string[] | number[];
            group: SettingGroup;
            validator?: (schema: Schema['properties'][K], value: BuildInSettings[K], path: string) => {
                path: string;
                property: K;
                message: string;
            }[];
            items?: {
                type: string;
                title: TTitle;
                properties: {
                    [K in string]: {
                        type: string;
                        title: TTitle;
                        description?: TTitle;
                        options: {
                            inputAttributes: {
                                placeholder: TTitle;
                            };
                        };
                    };
                };
            };
            [key: string]: any;
        };
    };
    required: (keyof BuildInSettings)[];
    groups: {
        label: TTitle;
        value: SettingGroup;
    }[];
};
export declare function getDefaultSettingSchema(): Schema;
