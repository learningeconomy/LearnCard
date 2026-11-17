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

declare module 'virtual:paraglide-lazy-locales' {
    /** Load a locale's messages if the build split them out. Resolves immediately otherwise. */
    export const loadLocaleMessages: (locale: string) => Promise<void>;
    /** True when `locale`'s messages can render now (always true without the split). */
    export const isLocaleMessagesLoaded: (locale: string) => boolean;
}
