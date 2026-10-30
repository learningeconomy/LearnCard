import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ConsentFlowContractDetails, LCNIntegration } from '@learncard/types';
import { ModalsProvider } from 'learn-card-base/components/modals/ModalsContext';
import Modals from 'learn-card-base/components/modals/Modals';
import { ModalAccessibilityManager } from 'learn-card-base/components/modals/ModalAccessibilityManager';
import { TenantConfigProvider } from 'learn-card-base/config/TenantConfigProvider';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/config/tenantDefaults';
import { ConsentFlowTestingTab } from './ConsentFlowTestingTab';
import { ContractsTab } from './ContractsTab';
import * as m from '../../../../paraglide/messages.js';
import { setLocale } from '../../../../paraglide/runtime.js';

const state = vi.hoisted(() => ({ getContract: vi.fn(), updateContract: vi.fn() }));
vi.mock('learn-card-base', async () => {
    const { useModal } = await import('learn-card-base/components/modals/useModal');
    const { ModalTypes } = await import('learn-card-base/components/modals/types/Modals');
    return {
        useModal,
        ModalTypes,
        useWallet: () => ({
            initWallet: async () => ({
                invoke: { getContract: state.getContract, updateContract: state.updateContract },
            }),
        }),
        useToast: () => ({ presentToast: vi.fn() }),
        ToastTypeEnum: { Error: 'error', Success: 'success' },
        useImageUpload: () => ({ handleFileSelect: vi.fn(), isLoading: false }),
        contractCategoryNameToCategoryMetadata: (key: string) => ({ title: key }),
        getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
        isConsentConflict: () => false,
    };
});
vi.mock('../hooks/useTemplateDetails', () => ({
    useTemplateDetails: () => ({ templates: [], isLoading: false }),
}));
vi.mock('../../../../i18n', async importOriginal => ({
    ...(await importOriginal<typeof import('../../../../i18n')>()),
    useLocale: () => 'en',
}));
vi.mock('../../../../helpers/contract.helpers', () => ({ CONTRACT_CATEGORIES: [] }));
vi.mock('../../../hidden/ContractCategoryMultiSelect', () => ({ default: () => null }));
vi.mock('../../../consentFlow/ConsentFlowGetAnAdult', () => ({ default: () => null }));
vi.mock('../../guides/shared/CodeOutputPanel', () => ({ CodeOutputPanel: () => null }));
vi.mock('../../../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'http://localhost:3000',
}));

const contract: ConsentFlowContractDetails = {
    uri: 'lc:contract:modal',
    name: 'Modal test app',
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
const integration: LCNIntegration = {
    id: 'modal-project',
    name: 'Modal project',
    publishableKey: 'test-publishable-key',
    whitelistedDomains: [],
    status: 'setup',
    guideState: { config: { consentFlowConfig: { contractUri: contract.uri } } },
};

const showTab = (project = integration, tab: 'contracts' | 'testing' = 'contracts') => {
    const root = document.createElement('div');
    root.id = 'app-router';
    document.body.append(root);
    const portal = document.createElement('div');
    portal.id = 'modal-mid-root';
    document.body.append(portal);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    render(
        <QueryClientProvider client={client}>
            <TenantConfigProvider config={DEFAULT_LEARNCARD_TENANT_CONFIG}>
                <ModalsProvider>
                    {tab === 'contracts' ? (
                        <ContractsTab integration={project} />
                    ) : (
                        <ConsentFlowTestingTab integration={project} templates={[]} />
                    )}
                    <Modals />
                    <ModalAccessibilityManager />
                </ModalsProvider>
            </TenantConfigProvider>
        </QueryClientProvider>,
        { container: root }
    );
};

beforeEach(() => {
    setLocale('en', { reload: false });
    state.getContract.mockReset().mockResolvedValue(structuredClone(contract));
    state.updateContract.mockReset().mockResolvedValue({
        version: 2,
        kind: 'relaxed',
        affectedUsers: 0,
        preview: {
            headline: 'Changed request',
            subhead: '',
            primaryLabel: 'Continue',
            rows: [],
        },
    });
});
afterEach(() => {
    cleanup();
    document.getElementById('app-router')?.remove();
    document.getElementById('modal-mid-root')?.remove();
});

describe('Contracts tab editor modal', () => {
    it('opens on demand from Contracts and discards an unpublished draft on close', async () => {
        showTab();
        expect(screen.queryByLabelText('Contract Name')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Update contract' }));
        await screen.findByLabelText('Contract Name');
        expect(screen.queryByLabelText(/Why are you making this update/)).toBeNull();
        fireEvent.change(screen.getByRole('textbox', { name: /Subtitle/ }), {
            target: { value: 'Unpublished draft' },
        });
        expect(screen.getByLabelText(/Why are you making this update/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Close contract editor' }));
        await waitFor(() => expect(screen.queryByLabelText('Contract Name')).toBeNull());
        fireEvent.click(screen.getByRole('button', { name: 'Update contract' }));
        expect(await screen.findByRole('textbox', { name: /Subtitle/ })).toHaveValue(
            'Original subtitle'
        );
        expect(state.updateContract).not.toHaveBeenCalled();
    });
    it('dismisses only the stacked preview with Escape and returns focus and the draft to the editor', async () => {
        showTab();
        fireEvent.click(screen.getByRole('button', { name: 'Update contract' }));
        await screen.findByLabelText('Contract Name');
        fireEvent.change(screen.getByRole('textbox', { name: /Subtitle/ }), {
            target: { value: 'Keep this draft' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Preview Update' }));
        const closePreview = await screen.findByRole('button', { name: 'Close', exact: true });
        const previewDialog = closePreview.closest('[role="dialog"]');
        expect(previewDialog).not.toBeNull();
        expect(within(previewDialog as HTMLElement).queryByLabelText('Contract Name')).toBeNull();
        fireEvent.keyDown(document, { key: 'Escape' });
        await screen.findByRole('button', { name: 'Close contract editor' });
        expect(screen.getByRole('textbox', { name: /Subtitle/ })).toHaveValue('Keep this draft');
        await waitFor(() =>
            expect(screen.getByRole('dialog')).toContainElement(
                document.activeElement as HTMLElement
            )
        );
    });
    it('does not offer updates when there are no configured contracts', () => {
        showTab({ ...integration, guideState: {} });
        expect(screen.queryByRole('button', { name: 'Update contract' })).toBeNull();
        expect(screen.queryByRole('dialog')).toBeNull();
    });
    it('does not expose the editor from Testing anymore', () => {
        showTab(integration, 'testing');
        expect(screen.queryByRole('button', { name: 'Update contract' })).toBeNull();
        expect(screen.queryByLabelText('Contract Name')).toBeNull();
    });
    it('opens the selected contract when a project configures multiple contracts', async () => {
        const otherContract = { ...contract, uri: 'lc:contract:issuing', name: 'Issuing contract' };
        state.getContract.mockImplementation(async (uri: string) =>
            structuredClone(uri === otherContract.uri ? otherContract : contract)
        );
        showTab({
            ...integration,
            guideState: {
                config: {
                    consentFlowConfig: { contractUri: contract.uri },
                    embedAppConfig: {
                        featureConfig: {
                            'issue-credentials': { contractUri: otherContract.uri },
                        },
                    },
                },
            },
        });
        const issuingCard = screen.getByRole('region', {
            name: m['developerPortal.dashboards.tabs.contracts.credentialIssuanceContract'](),
        });
        fireEvent.click(within(issuingCard).getByRole('button', { name: 'Update contract' }));
        expect(await screen.findByLabelText('Contract Name')).toHaveValue('Issuing contract');
        fireEvent.click(screen.getByRole('button', { name: 'Close contract editor' }));
        await waitFor(() => expect(screen.queryByLabelText('Contract Name')).toBeNull());
        const flowCard = screen.getByRole('region', {
            name: m['developerPortal.dashboards.tabs.contracts.consentFlowContract'](),
        });
        fireEvent.click(within(flowCard).getByRole('button', { name: 'Update contract' }));
        expect(await screen.findByLabelText('Contract Name')).toHaveValue(contract.name);
    });
});
