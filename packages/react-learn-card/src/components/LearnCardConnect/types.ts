export interface ContextData {
    prompt: string;
    metadata: {
        did: string;
        name?: string;
        [key: string]: unknown;
    };
    structuredContext?: unknown;
    credentials?: unknown[];
}

export interface LearnCardError {
    code: string;
    message: string;
}

export interface LearnCardConnectProps {
    apiKey: string;
    onContextReady: (context: ContextData) => void;
    onError?: (error: LearnCardError) => void;
    buttonText?: string;
    theme?: {
        primaryColor?: string;
        accentColor?: string;
        borderRadius?: string;
    };
    mode?: 'modal' | 'popup';
    includeRawCredentials?: boolean;
    className?: string;
    style?: React.CSSProperties;
    hostOrigin?: string;
    requestTimeout?: number;
    instructions?: string;
    detailLevel?: 'compact' | 'expanded';
}

export interface RequestContextMessage {
    protocol: 'LEARNCARD_V1';
    action: 'REQUEST_CONTEXT';
    requestId: string;
    payload: {
        apiKey: string;
        instructions?: string;
        detailLevel?: 'compact' | 'expanded';
        includeRawCredentials?: boolean;
    };
}

export interface ContextResponse {
    protocol: 'LEARNCARD_V1';
    requestId: string;
    type: 'SUCCESS' | 'ERROR';
    data?: ContextData;
    error?: LearnCardError;
}
