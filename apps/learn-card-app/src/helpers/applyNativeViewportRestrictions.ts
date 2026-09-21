const NATIVE_VIEWPORT_RESTRICTIONS = 'minimum-scale=1.0, maximum-scale=1.0, user-scalable=no';

/** Keeps Capacitor's in-app viewport fixed without restricting browser zoom. */
export const applyNativeViewportRestrictions = (isNativePlatform: boolean): void => {
    if (!isNativePlatform) return;

    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const content = viewport?.getAttribute('content');

    if (viewport) {
        viewport.setAttribute(
            'content',
            [content, NATIVE_VIEWPORT_RESTRICTIONS].filter(Boolean).join(', ')
        );
    }
};
