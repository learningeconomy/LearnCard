declare var IS_PRODUCTION: boolean;
declare var __PACKAGE_VERSION__: string;

declare module '*.svg' {
    const src: string;
    export default src;
}
