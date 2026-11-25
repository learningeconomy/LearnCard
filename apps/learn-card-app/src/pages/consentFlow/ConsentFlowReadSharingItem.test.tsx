import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { TenantConfigProvider } from 'learn-card-base/config/TenantConfigProvider';
import type { TenantConfig } from 'learn-card-base/config/tenantConfig';

import local from '../../../environments/vetpass/config.local.json';
import { useContractProfileFieldLabel } from '../../hooks/useContractProfileFieldLabel';
import { useContractCategoryInfo } from '../../hooks/useContractCategoryInfo';
import ConsentFlowReadSharingItem from './ConsentFlowReadSharingItem';

const mocks = vi.hoisted(() => ({ newModal: vi.fn(), count: vi.fn() }));
vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal: mocks.newModal }),
    useGetCredentialCount: (category: string) => {
        mocks.count(category);
        return { data: 0 };
    },
    ModalTypes: { Right: 'right' },
}));
vi.mock('@ionic/react', () => ({ IonRippleEffect: () => null }));
vi.mock('./ConsentFlowReadSharingModal', () => ({ default: () => null }));
vi.mock('../../helpers/contract.helpers', () => ({
    getInfoFromContractKey: (category: string) => ({
        IconComponent: () => null,
        title: category === 'Achievement' ? 'Achievements' : category,
        plural: category === 'Achievement' ? 'Achievements' : category,
    }),
}));

const config = { ...local, tenantId: 'vetpass' } as unknown as TenantConfig;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TenantConfigProvider config={config}>{children}</TenantConfigProvider>
);
const categoryFor = (field: string) => `VerifiableData:vetpass:military-profile:${field}`;
const term = { sharing: false, shareAll: false, shared: [] };

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

it('renders all configured VetPass field labels without exposing category keys', () => {
    render(
        <ul>
            {Object.keys(local.verifiableDataSchemas['military-profile'].fields).map(field => (
                <ConsentFlowReadSharingItem
                    key={field}
                    category={categoryFor(field)}
                    term={term}
                    required={field === 'branch'}
                />
            ))}
        </ul>,
        { wrapper }
    );

    for (const { label } of Object.values(local.verifiableDataSchemas['military-profile'].fields)) {
        expect(screen.getByRole('heading', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByText(/VerifiableData:/)).not.toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
});

it('uses the original category for credential queries and the selection modal', () => {
    const category = categoryFor('branch');
    const setTerm = vi.fn();
    render(
        <ConsentFlowReadSharingItem category={category} term={term} setTerm={setTerm} required />,
        { wrapper }
    );

    fireEvent.click(screen.getByRole('button', { name: /Branch of service/ }));
    expect(mocks.count).toHaveBeenCalledWith(category);
    expect(mocks.newModal.mock.calls[0][0].props).toMatchObject({
        category,
        term,
        setTerm,
        required: true,
    });
});

it.each([categoryFor('unknown'), 'VerifiableData:another-tenant:military-profile:branch'])(
    'hides the internal identifier when a field cannot be resolved: %s',
    category => {
        render(<ConsentFlowReadSharingItem category={category} term={term} />, { wrapper });
        expect(screen.getByRole('heading', { name: 'Field unavailable' })).toBeInTheDocument();
        expect(screen.queryByText(/VerifiableData:/)).not.toBeInTheDocument();
    }
);

it('uses the configured label in modal help text without pluralizing the identifier', () => {
    const { result } = renderHook(() => useContractCategoryInfo(categoryFor('branch')), {
        wrapper,
    });
    expect(result.current.title).toBe('Branch of service');
    expect(result.current.plural).toBe('Branch of service');
});

it.each(['Achievement', 'Goals'])('preserves ordinary category labels for %s', category => {
    render(<ConsentFlowReadSharingItem category={category} term={term} />, { wrapper });
    expect(
        screen.getByRole('heading', { name: category === 'Achievement' ? 'Achievements' : 'Goals' })
    ).toBeInTheDocument();
});

it('identifies unresolved admin fields while keeping configured labels readable', () => {
    const { result } = renderHook(
        () => useContractProfileFieldLabel({ includeUnresolvedKey: true }),
        { wrapper }
    );
    const unknown = categoryFor('unknown');
    expect(result.current(unknown)).toBe(`Field unavailable (${unknown})`);
    expect(result.current(categoryFor('branch'))).toBe('Branch of service');
});
