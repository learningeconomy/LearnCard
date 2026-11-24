import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

// Simulate the production split: non-base locales start unloaded and load on demand.
const lazy = vi.hoisted(() => ({
    loaded: new Set<string>(['en']),
    pending: new Map<string, { resolve: () => void; reject: (error: Error) => void }>(),
}));

vi.mock('./localeMessages', () => ({
    isLocaleMessagesLoaded: (locale: string) => lazy.loaded.has(locale),
    loadLocaleMessages: (locale: string) =>
        new Promise<void>((resolve, reject) => {
            lazy.pending.set(locale, {
                resolve: () => {
                    lazy.loaded.add(locale);
                    resolve();
                },
                reject,
            });
        }),
}));

// Auto-detection resolves to the current locale, so it never switches during these tests.
vi.mock('./detectLocale', async importOriginal => ({
    ...(await importOriginal<typeof import('./detectLocale')>()),
    detectInitialLocale: async () => 'en',
}));

import { LocaleProvider, useChangeLocale, useLocale } from './index';
import { getLocale } from '../paraglide/runtime.js';
import * as m from '../paraglide/messages.js';

let change: (lang: 'en' | 'es' | 'fr' | 'ar') => void = () => undefined;
const Probe = () => {
    change = useChangeLocale();
    return <span data-testid="locale">{useLocale()}</span>;
};
const shown = () => screen.getByTestId('locale').textContent;

const flush = () => act(async () => undefined);

beforeEach(() => {
    localStorage.clear();
    lazy.loaded = new Set(['en']);
    lazy.pending.clear();
    render(
        <LocaleProvider>
            <Probe />
        </LocaleProvider>
    );
});
afterEach(() => localStorage.clear());

it('waits for a lazily split locale to load before switching to it', async () => {
    act(() => change('es'));
    expect(shown()).toBe('en');
    expect(getLocale()).toBe('en');
    expect(localStorage.getItem('i18n.language')).toBeNull();

    await act(async () => lazy.pending.get('es')!.resolve());
    expect(shown()).toBe('es');
    expect(getLocale()).toBe('es');
    expect(localStorage.getItem('i18n.language')).toBe('es');
    // Real catalog (unsplit in tests): Spanish now renders.
    expect(m['classlinkPersonalEmail.title']()).toBe('Añade un correo personal');
});

it('switches synchronously when the locale is already loaded', () => {
    lazy.loaded.add('fr');
    act(() => change('fr'));
    expect(shown()).toBe('fr');
    expect(lazy.pending.size).toBe(0);
});

it('never lets a slower load override a newer choice', async () => {
    act(() => change('es'));
    act(() => change('fr'));
    await act(async () => lazy.pending.get('fr')!.resolve());
    expect(shown()).toBe('fr');

    await act(async () => lazy.pending.get('es')!.resolve());
    await flush();
    expect(shown()).toBe('fr');
    expect(localStorage.getItem('i18n.language')).toBe('fr');
});

it('still switches if a locale fails to load (its strings fall back to the base locale)', async () => {
    act(() => change('ar'));
    await act(async () => lazy.pending.get('ar')!.reject(new Error('chunk load failed')));
    await flush();
    expect(shown()).toBe('ar');
    expect(getLocale()).toBe('ar');
});
