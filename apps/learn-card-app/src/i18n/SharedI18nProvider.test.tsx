import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useT } from 'learn-card-base/i18n';

import { LocaleProvider } from './index';
import { SharedI18nProvider } from './SharedI18nProvider';

const IssuerRelationshipLabels: React.FC = () => {
    const t = useT();

    return (
        <>
            <span>{t('verification.fromConnection', { name: 'Avery Johnson' })}</span>
            <span>{t('verification.knownByConnections', { count: 3 })}</span>
        </>
    );
};

describe('SharedI18nProvider issuer relationship labels', () => {
    beforeEach(() => localStorage.setItem('i18n.language', 'en'));

    it('renders connection names and mutual-connection counts through the host catalog', () => {
        render(
            <LocaleProvider>
                <SharedI18nProvider>
                    <IssuerRelationshipLabels />
                </SharedI18nProvider>
            </LocaleProvider>
        );

        expect(screen.getByText('From your connection Avery Johnson')).toBeInTheDocument();
        expect(screen.getByText('Known by 3 of your connections')).toBeInTheDocument();
    });
});
