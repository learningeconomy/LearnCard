// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (vc: VC) => vc.boostCredential ?? vc,
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'addressBook.contactsCount': ({ count }: { count: number }) => `${count} contacts`,
}));

import TroopButton from './TroopButton';

afterEach(() => cleanup());

describe('membership contact group locators', () => {
    it.each(['direct', 'legacy'] as const)(
        'selects a %s ID using its separate storage URI',
        kind => {
            const inner: VC = {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiableCredential', 'BoostCredential', 'BoostID'],
                issuer: 'did:example:issuer',
                name: 'Troop 123',
                boostId: 'lc:network:example.org/trpc:boost:troop',
                uri: 'https://example.org/a-signed-claim',
                credentialSubject: { achievement: { achievementType: 'ext:TroopID' } },
                proof: {
                    type: 'DataIntegrityProof',
                    proofPurpose: 'assertionMethod',
                    verificationMethod: 'did:example:issuer#key',
                    created: '2026-10-13T00:00:00Z',
                },
            };
            const credential =
                kind === 'direct'
                    ? inner
                    : {
                          ...inner,
                          type: ['VerifiableCredential', 'CertifiedBoostCredential'],
                          boostCredential: inner,
                      };
            const uri = 'lc:network:example.org/trpc:credential:troop-id';
            const onSelect = vi.fn();

            render(
                <TroopButton
                    record={credential}
                    credentialUri={uri}
                    handleSelectingContactGroup={onSelect}
                    selectedGroup={null}
                    troopCountsInModal={{ [uri]: 5 }}
                />
            );
            fireEvent.click(screen.getByRole('button', { name: 'Troop 123 5 contacts' }));
            expect(onSelect).toHaveBeenCalledWith(uri, inner.boostId);
            expect(inner.uri).toBe('https://example.org/a-signed-claim');
        }
    );
});
