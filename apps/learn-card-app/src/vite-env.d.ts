/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ANALYTICS_PROVIDER?: 'posthog' | 'firebase' | 'noop';
    readonly VITE_POSTHOG_KEY?: string;
    readonly VITE_POSTHOG_HOST?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
