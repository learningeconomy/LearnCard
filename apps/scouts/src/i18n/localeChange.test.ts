import { describe, expect, it, vi } from 'vitest';

import { applyLocaleChange } from './localeChange';

describe('applyLocaleChange', () => {
    it('changes the active locale even when persistence throws', () => {
        const events: string[] = [];
        const setRuntimeLocale = vi.fn((locale: string) => events.push(`runtime:${locale}`));
        const setReactLocale = vi.fn((locale: string) => events.push(`react:${locale}`));
        const storage = {
            setItem: vi.fn(() => {
                events.push('storage');
                throw new DOMException('Storage disabled', 'SecurityError');
            }),
        };

        expect(() =>
            applyLocaleChange('fr', setRuntimeLocale, setReactLocale, storage)
        ).not.toThrow();
        expect(events).toEqual(['runtime:fr', 'react:fr', 'storage']);
    });
});
