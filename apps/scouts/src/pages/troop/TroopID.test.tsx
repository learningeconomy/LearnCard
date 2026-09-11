// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TroopID from './TroopID';
import { LocaleProvider, useChangeLocale } from '../../i18n';
import { setLocale } from '../../paraglide/runtime.js';

vi.mock('learn-card-base', () => ({
    useGetCredentialWithEdits: (credential: unknown) => ({ credentialWithEdits: credential }),
}));

vi.mock('../../stores/troopPageStore', () => ({
    ScoutsRoleEnum: {
        global: 'global',
        leader: 'leader',
        national: 'national',
        scout: 'scout',
    },
    default: { set: { showIdDetails: vi.fn() } },
}));

vi.mock('../../hooks/useGetTroopNetwork', () => ({
    default: () => ({ network: undefined }),
}));

vi.mock('../../helpers/troop.helpers', () => ({
    getDefaultBadgeThumbForCredential: () => null,
    getIdBackgroundStyles: () => ({}),
    getRoleFromCred: () => 'scout',
}));

vi.mock('../../components/svgs/ScoutIdThumbPlaceholder', () => ({ default: () => null }));
vi.mock('../../components/svgs/LeaderIdThumbPlaceholder', () => ({ default: () => null }));
vi.mock('../../components/svgs/NationalAdminIdThumbPlaceholder', () => ({
    default: () => null,
}));
vi.mock('../../components/svgs/GlobalAdminIdThumbPlaceholder', () => ({ default: () => null }));

const LocaleSwitch: React.FC = () => {
    const changeLocale = useChangeLocale();

    return <button onClick={() => changeLocale('fr')}>Switch to French</button>;
};

describe('TroopID localized issue date', () => {
    beforeEach(() => setLocale('en', { reload: false }));

    afterEach(() => {
        cleanup();
        setLocale('en', { reload: false });
    });

    it('reformats the issue date after a live locale change', () => {
        const issuanceDate = '2026-01-05T12:00:00Z';
        const date = new Date(issuanceDate);
        const englishDate = new Intl.DateTimeFormat('en', { dateStyle: 'short' }).format(date);
        const frenchDate = new Intl.DateTimeFormat('fr', { dateStyle: 'short' }).format(date);

        render(
            <LocaleProvider>
                <LocaleSwitch />
                <TroopID credential={{ issuanceDate, name: 'Test Troop' } as never} />
            </LocaleProvider>
        );

        expect(screen.getByText(new RegExp(englishDate))).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Switch to French' }));

        expect(screen.getByText(new RegExp(frenchDate))).toBeTruthy();
        expect(screen.queryByText(new RegExp(englishDate))).toBeNull();
    });
});
