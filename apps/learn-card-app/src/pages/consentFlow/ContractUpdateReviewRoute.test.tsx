import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContractUpdateReviewRoute from './ContractUpdateReviewRoute';
vi.mock('../../i18n', () => ({ useLocale: () => 'en' }));

type RouteRecord = {
    uri: string;
    consentedVersion: number;
    newOptionsUntil?: string;
    terms: { read: { credentials: { categories: Record<string, unknown> } } };
    contract: {
        uri: string;
        name: string;
        owner: { did: string };
        contract: { read: { credentials: { categories: Record<string, unknown> } } };
    };
    cumulativeUpdate: {
        kind: string;
        toVersion: number;
        diff: { added: unknown[]; removed: unknown[]; changed: unknown[] };
        preview: { headline: string; subhead: string; primaryLabel: string; rows: unknown[] };
    };
};

type ReviewTestProps = {
    preview: { headline: string };
    onAccept: (keys: string[]) => Promise<void>;
};

const state = vi.hoisted(() => ({
    records: [] as RouteRecord[],
    profile: { profileId: 'profile-1' } as { profileId: string } | null,
    profileLoading: false,
    walletReady: true,
    status: { status: 'live', consentedVersion: 0, currentVersion: 2 },
    mutateAsync: vi.fn(),
    refetch: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    contractCategoryNameToCategoryMetadata: () => undefined,
    isConsentConflict: (error: unknown) => {
        if (!error || typeof error !== 'object' || !('data' in error)) return false;
        const data = error.data;
        return Boolean(
            data && typeof data === 'object' && 'code' in data && data.code === 'CONFLICT'
        );
    },
    useConsentedContracts: () => ({
        data: state.records,
        isLoading: false,
        refetch: state.refetch,
    }),
    useCurrentUser: () => ({}),
    useGetCurrentLCNUser: () => ({
        currentLCNUser: state.profile,
        currentLCNUserLoading: state.profileLoading,
    }),
    useUpdateTerms: () => ({ mutateAsync: state.mutateAsync }),
    useWallet: () => ({ initWallet: vi.fn() }),
}));
vi.mock('learn-card-base/stores/walletStore', () => ({
    walletStore: {
        use: { wallet: () => (state.walletReady ? { id: { did: () => 'did:key:review' } } : null) },
    },
}));
vi.mock('@tanstack/react-query', () => ({
    useQuery: () => ({ data: state.status, isLoading: false, isError: false }),
}));
vi.mock('@learncard/helpers', () => ({
    buildContractUpdatePreview: (input: {
        kind: string;
        name: string;
        diff: { added: unknown[] };
        translate: (key: string, values?: Record<string, unknown>) => string;
    }) => ({
        headline: `version-${state.records[0]?.cumulativeUpdate?.toVersion}`,
        subhead: `${input.name}-${input.kind}`,
        primaryLabel: input.translate('consentUpdate.action.continue'),
        rows: input.diff.added,
    }),
}));
vi.mock('./contractUpdateReview.helpers', () => ({
    applyContractUpdateScopeChoices: () => [],
    getDefaultEnabledOptionalUpdateScopeKeys: () => [],
    getEnabledOptionalUpdateScopeKeys: () => [],
    getUnchangedAccessScopes: () => [],
    isContractUpdateScopeEnabled: () => false,
}));
vi.mock('../../hooks/useGuardianGate', () => ({
    useGuardianGate: () => ({
        guardedAction: async (action: () => Promise<void>) => action(),
        isChildProfile: false,
    }),
}));
vi.mock('./ContractUpdateReview', () => ({
    default: (props: ReviewTestProps) => (
        <div>
            <p>{props.preview.headline}</p>
            <button type="button" onClick={() => void props.onAccept([]).catch(() => {})}>
                Accept
            </button>
        </div>
    ),
}));

const makeRecord = (toVersion: number, includeOptional = false): RouteRecord => {
    const optionalRow = {
        scope: { area: 'write', type: 'credential', key: 'CERTIFICATE', required: false },
        change: 'added',
        label: 'Certificate',
        subtitle: 'Optional',
    };
    const rows = includeOptional ? [optionalRow] : [];
    return {
        uri: 'record-uri',
        consentedVersion: 1,
        terms: { read: { credentials: { categories: {} } } },
        contract: {
            uri: 'contract-uri',
            name: 'Example',
            owner: { did: 'did:example:owner' },
            contract: { read: { credentials: { categories: {} } } },
        },
        cumulativeUpdate: {
            kind: 'requires_consent',
            toVersion,
            diff: { added: rows, removed: [], changed: [] },
            preview: { headline: 'server headline', subhead: '', primaryLabel: '', rows },
        },
    };
};

const showRoute = () =>
    render(
        <MemoryRouter initialEntries={['/consent-flow/review?uri=contract-uri']}>
            <ContractUpdateReviewRoute />
        </MemoryRouter>
    );

beforeEach(() => {
    state.records = [makeRecord(2)];
    state.profile = { profileId: 'profile-1' };
    state.profileLoading = false;
    state.walletReady = true;
    state.status = { status: 'live', consentedVersion: 0, currentVersion: 2 };
    state.mutateAsync.mockReset().mockResolvedValue(true);
    state.refetch.mockReset().mockImplementation(async () => ({ data: state.records }));
});

describe('ContractUpdateReviewRoute', () => {
    it('waits for wallet profile prerequisites instead of flashing unavailable on cold start', () => {
        state.profile = null;
        state.profileLoading = true;
        showRoute();
        expect(screen.getByRole('main').getAttribute('aria-live')).toBe('polite');
        expect(screen.queryByText('This update is no longer available.')).toBeNull();
    });

    it('waits while the reconstructed wallet is absent and queries are disabled', () => {
        state.walletReady = false;
        state.profile = null;
        state.profileLoading = false;
        state.records = [];
        showRoute();
        expect(screen.getByRole('main').querySelector('ion-spinner')).not.toBeNull();
        expect(screen.queryByText('This update is no longer available.')).toBeNull();
    });

    it('restores a handled version from its consent record even when the status cache is behind', async () => {
        state.records = [{ ...makeRecord(2, true), consentedVersion: 2 }];
        state.status = { status: 'live', consentedVersion: 1, currentVersion: 2 };
        showRoute();
        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
        await waitFor(() => expect(state.mutateAsync).toHaveBeenCalledOnce());
        expect(state.mutateAsync.mock.calls[0][0]).not.toHaveProperty('acceptVersion');
    });
});
