// @vitest-environment happy-dom

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({
    locale: 'en',
    setLocale: vi.fn(),
}));

const nativeDevice = vi.hoisted(() => ({
    enabled: false,
    getLanguageCode: vi.fn<[], Promise<{ value: string }>>(),
}));

vi.mock('../paraglide/runtime.js', () => ({
    getLocale: () => runtime.locale,
    setLocale: (locale: string) => {
        runtime.locale = locale;
        runtime.setLocale(locale);
    },
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: () => nativeDevice.enabled,
    },
}));

vi.mock('@capacitor/device', () => ({
    Device: {
        getLanguageCode: () => nativeDevice.getLanguageCode(),
    },
}));

import { LocaleProvider, useChangeLocale, useLocale } from './index';

const createMemoryStorage = (): Storage => {
    const values = new Map<string, string>();

    return {
        get length() {
            return values.size;
        },
        clear: () => values.clear(),
        getItem: key => values.get(key) ?? null,
        key: index => [...values.keys()][index] ?? null,
        removeItem: key => values.delete(key),
        setItem: (key, value) => values.set(key, value),
    };
};

const LocaleProbe: React.FC = () => {
    const locale = useLocale();
    const changeLocale = useChangeLocale();

    return (
        <div>
            <output aria-label="active locale">{locale}</output>
            <button type="button" onClick={() => changeLocale('fr')}>
                Switch to French
            </button>
        </div>
    );
};

describe('LocaleProvider', () => {
    let storage: Storage;

    beforeEach(() => {
        runtime.locale = 'en';
        runtime.setLocale.mockClear();
        nativeDevice.enabled = false;
        nativeDevice.getLanguageCode.mockReset();
        storage = createMemoryStorage();
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: storage,
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('keeps a persisted English choice when the Paraglide runtime starts in French', () => {
        runtime.locale = 'fr';
        storage.setItem('i18n.language', 'en');

        render(
            <LocaleProvider>
                <LocaleProbe />
            </LocaleProvider>
        );

        expect(screen.getByLabelText('active locale').textContent).toBe('en');
        expect(runtime.setLocale).toHaveBeenCalledWith('en');
    });

    it('renders when access to the localStorage getter throws', () => {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            get: () => {
                throw new DOMException('Storage disabled', 'SecurityError');
            },
        });

        try {
            expect(() =>
                render(
                    <LocaleProvider>
                        <LocaleProbe />
                    </LocaleProvider>
                )
            ).not.toThrow();
            expect(screen.getByLabelText('active locale').textContent).toBe('en');
        } finally {
            if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
        }
    });

    it('does not let pending native detection overwrite a later manual choice', async () => {
        nativeDevice.enabled = true;
        let resolveDeviceLocale: ((value: { value: string }) => void) | undefined;
        nativeDevice.getLanguageCode.mockReturnValue(
            new Promise(resolve => {
                resolveDeviceLocale = resolve;
            })
        );

        render(
            <LocaleProvider>
                <LocaleProbe />
            </LocaleProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Switch to French' }));
        expect(screen.getByLabelText('active locale').textContent).toBe('fr');

        await act(async () => {
            resolveDeviceLocale?.({ value: 'es' });
            await Promise.resolve();
        });

        expect(screen.getByLabelText('active locale').textContent).toBe('fr');
        expect(storage.getItem('i18n.language')).toBe('fr');
    });
});
