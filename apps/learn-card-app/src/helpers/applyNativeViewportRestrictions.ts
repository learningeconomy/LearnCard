const NATIVE_VIEWPORT_RESTRICTIONS = 'minimum-scale=1.0, maximum-scale=1.0, user-scalable=no';

/**
 * Keeps Capacitor's in-app viewport fixed without restricting browser zoom.
 *
 * Web and installed-PWA users keep pinch-zoom (WCAG 1.4.4). Native WebViews stay
 * fixed because pinch-zoom breaks Ionic's fixed chrome there; native users rely
 * on the OS text-size settings instead. The a11y suite runs the web build, so a
 * passing `meta-viewport` gate does not cover the native shell.
 */
export const applyNativeViewportRestrictions = (isNativePlatform: boolean): void => {
    if (!isNativePlatform) return;

    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!viewport) return;

    const content = viewport.getAttribute('content') ?? '';
    if (content.includes('user-scalable')) return;

    viewport.setAttribute(
        'content',
        [content, NATIVE_VIEWPORT_RESTRICTIONS].filter(Boolean).join(', ')
    );
};
