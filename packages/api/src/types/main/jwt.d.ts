interface Payload {
    role: 'admin' | 'guest';
}
export declare function getToken(payload: Payload, expiresIn?: string | number): string;
export declare function verify(token: string): Payload;
export {};
