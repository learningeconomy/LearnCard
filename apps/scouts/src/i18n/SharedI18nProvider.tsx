/**
 * SharedI18nProvider — bridges the app's Paraglide catalog into the shared
 * packages (`learn-card-base` and `@learncard/react`).
 *
 * Each package ships its own dependency-free i18n adapter (English by default;
 * see Claude Notes/LearnCard/2026-06-17-localizing-shared-packages-base-and-react-sdk.md).
 * Here we mount each package's <I18nProvider> with a resolver that delegates to
 * the app's compiled Paraglide messages, namespaced `base.*` / `sdk.*`. Keys the
 * app hasn't translated yet return undefined → the package falls back to its
 * co-located English default.
 *
 * `locale` from useLocale() flows into each provider so the package subtrees
 * re-render on language switch (Paraglide's runtime locale is global, but React
 * needs the value-identity change to re-render consumers).
 */
import React from 'react';

import * as m from '../paraglide/messages.js';
import { useLocale } from './index';

import { I18nProvider as BaseI18nProvider } from 'learn-card-base/i18n';
import type { I18nResolver } from 'learn-card-base/i18n';
import { I18nProvider as SdkI18nProvider } from '@learncard/react';

/** Build a resolver that looks up `<namespace>.<key>` in the app's catalog. */
const makeResolver =
    (namespace: string): I18nResolver =>
    (key: string, params?: Record<string, unknown>) => {
        const fn = (m as Record<string, unknown>)[`${namespace}.${key}`];
        return typeof fn === 'function'
            ? (fn as (p: Record<string, unknown>) => string)(params ?? {})
            : undefined;
    };

const baseResolver = makeResolver('base');
const sdkResolver = makeResolver('sdk');

export const SharedI18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const locale = useLocale();
    return (
        <BaseI18nProvider resolve={baseResolver} locale={locale}>
            <SdkI18nProvider resolve={sdkResolver} locale={locale}>
                {children}
            </SdkI18nProvider>
        </BaseI18nProvider>
    );
};

export default SharedI18nProvider;
