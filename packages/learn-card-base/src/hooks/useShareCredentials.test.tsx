// @vitest-environment jsdom

import React from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFixture } from '@learncard/credential-library';
import type { VC } from '@learncard/types';

// Wallet creation is outside this hook's contract; reads and queries use the cached wallet below.
vi.mock('../helpers/walletHelpers', () => ({ getBespokeLearnCard: vi.fn(), generatePK: vi.fn() }));
// Avoid importing the unused auth-provider stack into jsdom; retain the real stores,
// category metadata, credential classifier, and paginated query implementation.
vi.mock('learn-card-base', async () => {
    const metadata = await import('../types/boostAndCredentialMetadata');
    const { walletStore, switchedProfileStore } = await import('../stores/walletStore');
    const { selectedCredsStore } = await import('../stores/selectedCredsStore');
    return {
        ...metadata,
        switchedProfileStore,
        selectedCredsStore,
        useWallet: () => ({ initWallet: async () => walletStore.get.wallet() }),
    };
});

import { useShareCredentials } from './useShareCredentials';
import { walletStore } from '../stores/walletStore';
import { selectedCredsStore } from '../stores/selectedCredsStore';

const initialSelection = selectedCredsStore.get.state();
const initialWallet = walletStore.get.wallet();
let queryClient: QueryClient;

afterEach(() => {
    cleanup();
    queryClient?.clear();
    walletStore.set.wallet(initialWallet);
    selectedCredsStore.set.state(() => initialSelection);
});

describe('sharing category precedence', () => {
    it('preserves indexed overrides for wallet and preselected credentials and caches missing Boost categories', async () => {
        const fixture = getFixture('obv3/qualification-license')!;
        const license = fixture.credential as VC;
        const manualLicense = { ...license, id: 'urn:uuid:manual-license' };
        const qualification = { ...license, id: 'urn:uuid:qualification' };
        const wrap = (id: string, boostId: string): VC => ({
            ...license,
            id,
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostId,
            boostCredential: { ...license, boostId },
        });
        const manualBoost = wrap('urn:uuid:manual-boost', 'boost:manual');
        const firstBoost = wrap('urn:uuid:boost-one', 'boost:shared');
        const secondBoost = wrap('urn:uuid:boost-two', 'boost:shared');
        const records = [
            { id: 'manual', uri: 'stored:manual', category: 'ID', vc: manualLicense },
            {
                id: 'qualification',
                uri: 'stored:qualification',
                category: 'Qualifications',
                vc: qualification,
            },
            {
                id: 'manual-boost',
                uri: 'stored:manual-boost',
                category: 'Achievement',
                vc: manualBoost,
            },
            { id: 'boost-one', uri: 'stored:boost-one', vc: firstBoost },
            { id: 'boost-two', uri: 'stored:boost-two', vc: secondBoost },
            {
                id: 'unavailable',
                uri: 'stored:unavailable',
                category: 'Qualifications',
                vc: undefined,
            },
        ];
        const getBoost = vi.fn().mockResolvedValue({ category: 'ID' });
        walletStore.set.wallet({
            id: { did: () => 'did:example:sharing' },
            index: { LearnCloud: { getPage: async () => ({ records, hasMore: false }) } },
            read: { get: async (uri: string) => records.find(record => record.uri === uri)?.vc },
            invoke: { getBoost },
        } as never);
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        // Selection uses separate objects with the same signed IDs, not the cloud record URIs.
        const preselected = [
            { ...manualLicense },
            { ...qualification },
            { ...manualBoost },
            { ...firstBoost },
        ];
        const { result } = renderHook(() => useShareCredentials(preselected), {
            wrapper: ({ children }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            ),
        });
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.errorMessage).toBeUndefined();
        expect(result.current.credentials?.ids.map(vc => vc.id)).toEqual([
            'urn:uuid:manual-license',
            'urn:uuid:boost-one',
            'urn:uuid:boost-two',
        ]);
        expect(result.current.credentials?.qualifications.map(vc => vc.id)).toEqual([
            'urn:uuid:qualification',
        ]);
        expect(result.current.credentials?.achievements.map(vc => vc.id)).toEqual([
            'urn:uuid:manual-boost',
        ]);
        expect(result.current.allSelectedCredentialIds.sort()).toEqual([
            'urn:uuid:boost-one',
            'urn:uuid:manual-boost',
            'urn:uuid:manual-license',
            'urn:uuid:qualification',
        ]);
        expect(getBoost.mock.calls).toEqual([['boost:shared']]);
    });
});
