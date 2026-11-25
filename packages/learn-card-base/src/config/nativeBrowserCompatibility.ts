export const MIN_ANDROID_WEBVIEW_VERSION = 111;
export const NATIVE_BROWSER_ERROR_PATH = 'unsupported-browser.html';

type NativeBrowserConfig = {
    android?: { minWebViewVersion?: number; [key: string]: unknown };
    server?: { [key: string]: unknown };
};

/** Preserve tenant settings while enforcing the browser floor after native config copying. */
export const nativeBrowserCompatibility = (config: NativeBrowserConfig = {}) => ({
    android: {
        ...config.android,
        minWebViewVersion: Math.max(
            MIN_ANDROID_WEBVIEW_VERSION,
            config.android?.minWebViewVersion ?? MIN_ANDROID_WEBVIEW_VERSION
        ),
    },
    server: { ...config.server, errorPath: NATIVE_BROWSER_ERROR_PATH },
});
