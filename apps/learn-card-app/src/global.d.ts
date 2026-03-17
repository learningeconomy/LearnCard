declare var IS_PRODUCTION: boolean;
declare var SENTRY_DSN: string;
declare var SENTRY_ENV: string;

declare var LCN_URL: string | undefined;
declare var LCN_API_URL: string | undefined;
declare var CLOUD_URL: string | undefined;
declare var LEARN_CLOUD_XAPI_URL: string | undefined;
declare var API_URL: string | undefined;
declare var GOOGLE_MAPS_API_KEY: string | undefined;
declare var __PACKAGE_VERSION__: string;
declare var APP_THEME: string | undefined;
declare var CORS_PROXY_API_KEY: string | undefined;

declare module '*.png' {
    const src: string;
    export default src;
}

declare module '@digitalcredentials/jsonld' {
    interface DocumentLoaderResult {
        document: unknown;
        documentUrl?: string;
        contextUrl?: string;
    }

    interface ExpandOptions {
        documentLoader?: (url: string) => Promise<DocumentLoaderResult>;
        base?: string;
        expandContext?: unknown;
    }

    const jsonld: {
        expand(input: unknown, options?: ExpandOptions): Promise<unknown[]>;
    };

    export default jsonld;
}
