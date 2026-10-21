declare var IS_PRODUCTION: boolean;
declare var __PACKAGE_VERSION__: string;
declare var __APP_VERSION__: string;
declare var __BUILD_SHA__: string;
declare var __BUILD_DATE__: string;
declare var __CAPGO_DEFAULT_CHANNEL__: string;

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
