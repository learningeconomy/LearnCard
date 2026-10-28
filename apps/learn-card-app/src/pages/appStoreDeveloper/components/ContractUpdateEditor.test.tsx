import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ConsentFlowContractDetails } from '@learncard/types';
import ContractUpdateEditor from './ContractUpdateEditor';
import { setLocale } from '../../../paraglide/runtime.js';

const state = vi.hoisted(() => ({ getContract: vi.fn(), updateContract: vi.fn() }));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({
        initWallet: async () => ({
            invoke: { getContract: state.getContract, updateContract: state.updateContract },
        }),
    }),
    useImageUpload: () => ({ handleFileSelect: vi.fn(), isLoading: false }),
    contractCategoryNameToCategoryMetadata: (key: string) => ({ title: key }),
    getLogger: () => ({ error: vi.fn() }),
    isConsentConflict: () => false,
}));
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));
vi.mock('../../../helpers/contract.helpers', () => ({ CONTRACT_CATEGORIES: [] }));
vi.mock('../../hidden/ContractCategoryMultiSelect', () => ({ default: () => null }));
vi.mock('../../consentFlow/ContractUpdateReview', () => ({ default: () => null }));

const initial: ConsentFlowContractDetails = {
    uri: 'lc:contract:editor',
    name: 'Test app',
    subtitle: 'Original subtitle',
    version: 1,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    owner: {
        profileId: 'owner',
        did: 'did:example:owner',
        displayName: 'Owner',
        shortBio: '',
        bio: '',
    },
    contract: {
        read: { anonymize: true, credentials: { categories: {} }, personal: {} },
        write: { credentials: { categories: {} }, personal: {} },
    },
};
const showEditor = async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    render(
        <QueryClientProvider client={client}>
            <ContractUpdateEditor contractUri={initial.uri} />
        </QueryClientProvider>
    );
    await screen.findByLabelText('Contract Name');
};

beforeEach(() => {
    setLocale('en', { reload: false });
    state.getContract.mockReset().mockResolvedValue(structuredClone(initial));
    state.updateContract.mockReset();
});

describe('contract update authoring', () => {
    it('requires a reason for an approval-requiring edit and disables an unchanged request', async () => {
        await showEditor();
        expect(screen.getByRole('button', { name: 'Publish Update' })).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Contract Name'), {
            target: { value: 'New app identity' },
        });
        expect(screen.getByRole('button', { name: 'Publish Update' })).toBeDisabled();
        fireEvent.change(screen.getByLabelText(/Why are you making this update/), {
            target: { value: 'We renamed our app.' },
        });
        expect(screen.getByRole('button', { name: 'Publish Update' })).toBeEnabled();
        expect(state.updateContract).not.toHaveBeenCalled();
    });
    it('does not change a saved opt-in default when Required is toggled on and back off', async () => {
        state.getContract.mockResolvedValue({
            ...initial,
            contract: {
                ...initial.contract,
                read: {
                    ...initial.contract.read,
                    personal: {
                        email: { required: false, defaultEnabled: false, reason: 'Existing use' },
                    },
                },
            },
        });
        await showEditor();
        fireEvent.change(screen.getByLabelText(/Why are you making this update/), {
            target: { value: 'Testing whether this field should be required.' },
        });
        fireEvent.click(screen.getByRole('button', { name: /^optional$/i }));
        expect(screen.getByRole('button', { name: 'Publish Update' })).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: /^required$/i }));
        expect(screen.getByRole('button', { name: 'Publish Update' })).toBeDisabled();
        expect(state.updateContract).not.toHaveBeenCalled();
    });
    it('retains the edited form and allows retry after a failed publication', async () => {
        state.updateContract.mockRejectedValue(new Error('Connection failed'));
        await showEditor();
        fireEvent.change(screen.getByRole('textbox', { name: /Subtitle/ }), {
            target: { value: 'Keep my draft' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Publish Update' }));
        await screen.findByRole('alert');
        expect(screen.getByRole('textbox', { name: /Subtitle/ })).toHaveValue('Keep my draft');
        expect(screen.getByRole('button', { name: 'Publish Update' })).toBeEnabled();
        expect(screen.queryByText(/Update published/)).toBeNull();
    });
    it('requires an explicit reload instead of overwriting a newer saved version', async () => {
        const newer = { ...initial, version: 2, subtitle: 'Someone else saved this' };
        state.getContract.mockResolvedValueOnce(initial).mockResolvedValue(newer);
        await showEditor();
        fireEvent.change(screen.getByRole('textbox', { name: /Subtitle/ }), {
            target: { value: 'Stale local draft' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Publish Update' }));
        await screen.findByRole('alert');
        expect(state.updateContract).not.toHaveBeenCalled();
        expect(screen.getByRole('textbox', { name: /Subtitle/ })).toHaveValue('Stale local draft');
        fireEvent.click(screen.getByRole('button', { name: 'Reload current request' }));
        await waitFor(() =>
            expect(screen.getByRole('textbox', { name: /Subtitle/ })).toHaveValue(
                'Someone else saved this'
            )
        );
        expect(screen.getByRole('button', { name: 'Publish Update' })).toBeDisabled();
    });
    it('does not offer to publish again when saving succeeds but reloading fails', async () => {
        state.getContract
            .mockResolvedValueOnce(initial)
            .mockResolvedValueOnce(initial)
            .mockRejectedValue(new Error('Read failed'));
        state.updateContract.mockResolvedValue({
            version: 2,
            kind: 'relaxed',
            affectedUsers: 0,
            preview: { rows: [] },
        });
        await showEditor();
        fireEvent.change(screen.getByRole('textbox', { name: /Subtitle/ }), {
            target: { value: 'Published subtitle' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Publish Update' }));
        await screen.findByText('Update published · version 2');
        expect(screen.queryByRole('button', { name: 'Publish Update' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Reload current request' })).toBeEnabled();
        expect(state.updateContract).toHaveBeenCalledOnce();
    });
});
