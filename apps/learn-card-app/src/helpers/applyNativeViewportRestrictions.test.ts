import { afterEach, describe, expect, it } from 'vitest';

import { applyNativeViewportRestrictions } from './applyNativeViewportRestrictions';

const WEB_VIEWPORT_CONTENT = 'viewport-fit=cover, width=device-width, initial-scale=1.0';
const NATIVE_VIEWPORT_CONTENT = `${WEB_VIEWPORT_CONTENT}, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no`;

describe('applyNativeViewportRestrictions', () => {
    afterEach(() => {
        document.head.replaceChildren();
    });

    it('restores fixed scaling for native builds', () => {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = WEB_VIEWPORT_CONTENT;
        document.head.append(viewport);

        applyNativeViewportRestrictions(true);

        expect(viewport.content).toBe(NATIVE_VIEWPORT_CONTENT);
    });

    it('leaves web viewport scaling unrestricted', () => {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = WEB_VIEWPORT_CONTENT;
        document.head.append(viewport);

        applyNativeViewportRestrictions(false);

        expect(viewport.content).toBe(WEB_VIEWPORT_CONTENT);
    });

    it('does nothing when the document has no viewport metadata', () => {
        expect(() => applyNativeViewportRestrictions(true)).not.toThrow();
    });
});
