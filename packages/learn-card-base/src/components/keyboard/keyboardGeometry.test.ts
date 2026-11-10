import { describe, expect, it } from 'vitest';
import { getFocusScrollDelta, getKeyboardViewport } from './keyboardGeometry';

describe('keyboard viewport', () => {
    it('does not subtract the keyboard twice when the native WebView already resized', () => {
        expect(getKeyboardViewport(500, 800, 300)).toEqual({ top: 0, bottom: 500 });
    });

    it('handles an overlay keyboard without native resizing', () => {
        expect(getKeyboardViewport(800, 800, 300)).toEqual({ top: 0, bottom: 500 });
    });

    it('uses the visual viewport for mobile browsers and preserves the panning offset', () => {
        expect(getKeyboardViewport(800, 800, 0, { offsetTop: 60, height: 400 })).toEqual({
            top: 60,
            bottom: 460,
        });
    });

    it('never returns a negative visible height during a keyboard transition', () => {
        expect(getKeyboardViewport(100, 100, 300)).toEqual({ top: 0, bottom: 0 });
    });
});

describe('focused field reveal', () => {
    const viewport = { top: 100, bottom: 500 };
    it('leaves an already visible field in place', () => {
        expect(getFocusScrollDelta({ top: 150, bottom: 190 }, viewport)).toBe(0);
    });
    it('reveals only the covered edge with a breathing margin', () => {
        expect(getFocusScrollDelta({ top: 470, bottom: 510 }, viewport)).toBe(26);
        expect(getFocusScrollDelta({ top: 90, bottom: 130 }, viewport)).toBe(-26);
    });
    it('does not oscillate between the two edges of an oversized textarea', () => {
        expect(getFocusScrollDelta({ top: 116, bottom: 700 }, viewport)).toBe(0);
    });
});
