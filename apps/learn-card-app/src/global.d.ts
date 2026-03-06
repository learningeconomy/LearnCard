declare var IS_PRODUCTION: boolean;
declare var SENTRY_DSN: string;
declare var SENTRY_ENV: string;

declare var GOOGLE_MAPS_API_KEY: string | undefined;
declare var __PACKAGE_VERSION__: string;
declare var APP_THEME: string | undefined;
declare var CORS_PROXY_API_KEY: string | undefined;

declare module '*.png' {
    const src: string;
    export default src;
}
