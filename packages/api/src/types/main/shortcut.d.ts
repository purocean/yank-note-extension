declare const accelerators: {
    command: "hide-main-window" | "open-in-browser" | "show-main-window";
    accelerator: string | null;
    description: string;
}[];
declare type AcceleratorCommand = (typeof accelerators)[0]['command'];
declare let currentCommands: {
    [key in AcceleratorCommand]?: () => void;
};
export declare const getAccelerator: (command: AcceleratorCommand) => string | undefined;
export declare const registerShortcut: (commands: typeof currentCommands, showAlert?: boolean) => void;
export {};
