import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConsentFlowTransaction, LCNProfile } from '@learncard/types';
import TransactionHistoryItem from './TransactionHistoryItem';
import { setLocale } from '../../paraglide/runtime.js';

vi.mock('../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    default: () => null,
}));
vi.mock('../../i18n', () => ({ useLocale: () => 'en' }));
beforeEach(() => setLocale('en', { reload: false }));

const makeTransaction = (kind?: 'relaxed' | 'expanded_optional' | 'requires_consent') =>
    ({
        id: 'transaction-1',
        action: 'update',
        date: '2026-10-01T00:00:00.000Z',
        ...(kind ? { kind } : {}),
    }) as unknown as ConsentFlowTransaction;

describe('TransactionHistoryItem', () => {
    it('attributes developer-authored version updates to the app', () => {
        render(
            <TransactionHistoryItem
                transaction={makeTransaction('requires_consent')}
                contractOwner={{ displayName: 'Acme' } as unknown as LCNProfile}
                contractName="Connected App"
            />
        );

        expect(screen.getByText('App update')).toBeTruthy();
        expect(screen.getByText(/Connected App/)).toBeVisible();
        expect(screen.queryByText(/Acme/)).toBeNull();
        expect(screen.queryByText(/^You/)).toBeNull();
    });

    it('keeps legacy update records without a kind attributed to the user', () => {
        render(<TransactionHistoryItem transaction={makeTransaction()} />);

        expect(screen.getByText('Update')).toBeTruthy();
        expect(screen.getByText(/^You/)).toBeVisible();
    });

    it.each([
        ['suggest', 'Suggested', 'This app suggested a credential for you to accept.'],
        ['dismiss', 'Dismissed', 'You dismissed a suggested credential.'],
    ])('describes %s records (LC-2423)', (action, title, description) => {
        render(
            <TransactionHistoryItem
                transaction={
                    {
                        id: 'transaction-2',
                        action,
                        date: '2026-10-01T00:00:00.000Z',
                    } as unknown as ConsentFlowTransaction
                }
            />
        );
        expect(screen.getByText(title)).toBeTruthy();
        expect(screen.getByText(description)).toBeTruthy();
    });
});
