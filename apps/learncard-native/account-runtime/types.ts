export interface NativeUser {
    id: string;
    email: string;
    displayName?: string;
    createdAt?: string;
}
export interface NativeReply {
    status: number;
    body: string;
    contentType: string;
}
export interface NativeMessage {
    op: string;
    id?: string;
    field?: 'share' | 'version';
    value?: string;
    forceRefresh?: boolean;
}
export interface NativeGlobal {
    webkit: {
        messageHandlers: {
            accountNative: { postMessage: (input: NativeMessage) => Promise<string | null> };
            accountTransport: {
                postMessage: (input: {
                    url: string;
                    method: string;
                    headers: Record<string, string>;
                    body: string;
                }) => Promise<NativeReply>;
            };
        };
    };
}
