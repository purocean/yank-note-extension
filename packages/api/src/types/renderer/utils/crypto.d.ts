export declare function encrypt(content: any, password: string): {
    content: string;
    passwordHash: string;
};
export declare function decrypt(content: any, password: string): {
    content: string;
    passwordHash: string;
};
