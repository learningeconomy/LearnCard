/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ANALYTICS_PROVIDER?: 'posthog' | 'firebase' | 'noop';
    readonly VITE_POSTHOG_KEY?: string;
    readonly VITE_POSTHOG_HOST?: string;
    readonly VITE_AI_AGENT_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
