import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useT } from 'learn-card-base/i18n';

import { LocaleProvider } from './index';
import { SharedI18nProvider } from './SharedI18nProvider';

const IssuerRelationshipLabels: React.FC = () => {
    const t = useT();

    return (
        <>
            <span data-testid="connection-label">
                {t('verification.fromConnection', { name: 'Avery Johnson' })}
            </span>
            <span data-testid="mutuals-label">
                {t('verification.knownByConnections', { count: 3 })}
            </span>
        </>
    );
};

describe('SharedI18nProvider issuer relationship labels', () => {
    afterEach(() => {
        cleanup();
        localStorage.removeItem('i18n.language');
    });

    it.each([
        {
            locale: 'en',
            connection: 'From your connection Avery Johnson',
            mutuals: 'Known by 3 of your connections',
        },
        {
            locale: 'es',
            connection: 'De tu contacto Avery Johnson',
            mutuals: 'Conocido por 3 de tus contactos',
        },
        {
            locale: 'fr',
            connection: 'De votre contact Avery Johnson',
            mutuals: 'Connu par 3 de vos contacts',
        },
        {
            locale: 'ar',
            connection: 'من جهة اتصالك Avery Johnson',
            mutuals: 'معروف لدى 3 من جهات اتصالك',
        },
    ] as const)(
        'renders connection names and counts from the $locale host catalog',
        ({ locale, connection, mutuals }) => {
            localStorage.setItem('i18n.language', locale);

            render(
                <LocaleProvider>
                    <SharedI18nProvider>
                        <IssuerRelationshipLabels />
                    </SharedI18nProvider>
                </LocaleProvider>
            );

            expect(screen.getByTestId('connection-label')).toHaveTextContent(connection);
            expect(screen.getByTestId('mutuals-label')).toHaveTextContent(mutuals);
        }
    );
});
