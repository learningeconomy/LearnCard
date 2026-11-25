// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const host = vi.hoisted(() => ({
    parents: vi.fn(),
    count: vi.fn(),
    error: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useModal: () => ({ closeModal: vi.fn() }),
    useWallet: () => ({
        initWallet: async () => ({
            invoke: {
                getBoostParents: host.parents,
                countBoostRecipientsWithChildren: host.count,
            },
        }),
    }),
    useGetConnections: () => ({ data: [] }),
    getLogger: () => ({ error: host.error }),
}));
vi.mock('@ionic/react', () => ({
    IonRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonCol: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonInput: () => <input aria-label="Search" />,
    IonSpinner: () => <span>Loading contacts</span>,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (vc: VC) => vc.boostCredential ?? vc,
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'addressBook.selectFromContacts': () => 'Select from contacts',
    'addressBook.allContacts': () => 'All contacts',
    'addressBook.contactsCount': ({ count }: { count: number }) => `${count} contacts`,
    'common.search': () => 'Search',
}));

import AddressBookSelectionModal from './AddressBookSelectionModal';

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('membership contact counts', () => {
    it.each(['direct', 'legacy'] as const)(
        'resolves a %s ID by its signed Boost association and selects its storage record',
        async kind => {
            const boostId = 'lc:network:example.org/trpc:boost:scout';
            const storageUri = 'lc:network:example.org/trpc:credential:scout-id';
            const parentUri = 'lc:network:example.org/trpc:boost:troop';
            const inner: VC = {
                '@context': ['https://www.w3.org/ns/credentials/v2'],
                type: ['VerifiableCredential', 'BoostCredential', 'BoostID'],
                issuer: 'did:example:issuer',
                name: 'Troop 123',
                boostId,
                uri: 'https://example.org/a-signed-claim',
                credentialSubject: { achievement: { achievementType: 'ext:ScoutID' } },
                proof: {
                    type: 'DataIntegrityProof',
                    proofPurpose: 'assertionMethod',
                    verificationMethod: 'did:example:issuer#key',
                    created: '2026-10-13T00:00:00Z',
                },
            };
            const vc =
                kind === 'direct'
                    ? inner
                    : {
                          ...inner,
                          type: ['VerifiableCredential', 'CertifiedBoostCredential'],
                          boostCredential: inner,
                      };
            // A missing optional name must not crash filtering of the other groups.
            const unnamed = { ...inner, name: undefined, boostId: `${boostId}-unnamed` };
            host.parents.mockResolvedValue({ records: [{ type: 'ext:TroopID', uri: parentUri }] });
            host.count.mockResolvedValue(4);
            const onSelect = vi.fn();
            const setCounts = vi.fn();

            render(
                <AddressBookSelectionModal
                    records={[
                        { vc, uri: storageUri },
                        { vc: unnamed, uri: `${storageUri}-unnamed` },
                    ]}
                    isLoadingRecords={false}
                    selectedGroupId="all"
                    setTroopCounts={setCounts}
                    onGroupSelect={onSelect}
                />
            );

            const group = await screen.findByRole('button', { name: 'Troop 123 3 contacts' });
            expect(host.parents).toHaveBeenCalledWith(boostId);
            expect(host.count).toHaveBeenCalledWith(parentUri);
            await waitFor(() =>
                expect(setCounts).toHaveBeenCalledWith({
                    [storageUri]: 3,
                    [`${storageUri}-unnamed`]: 3,
                })
            );
            expect(host.error).not.toHaveBeenCalled();
            fireEvent.click(group);
            expect(onSelect).toHaveBeenCalledWith(storageUri, boostId);
            expect(inner.uri).toBe('https://example.org/a-signed-claim');
        }
    );
});
