import React, { type PropsWithChildren } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ConsentFlowReadSharingModal from './ConsentFlowReadSharingModal';

const mocks = vi.hoisted(() => ({ closeModal: vi.fn(), getList: vi.fn() }));
vi.mock('learn-card-base', () => ({
    useModal: () => ({ closeModal: mocks.closeModal }),
    useGetCredentialList: mocks.getList,
}));
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: PropsWithChildren) => <main>{children}</main>,
    IonContent: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('../../hooks/useContractCategoryInfo', () => ({
    useContractCategoryInfo: () => ({ title: 'Branch of service' }),
}));
vi.mock('../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    default: () => null,
}));
vi.mock('./ConsentFlowSelectiveSharingWarning', () => ({ default: () => null }));
vi.mock('../../theme/hooks/useTheme', () => ({ default: () => ({}) }));
afterEach(cleanup);

it('edits a saved field permission without loading the generic credential cards', () => {
    const setTerm = vi.fn();
    render(
        <ConsentFlowReadSharingModal
            category="VerifiableData:demo:profile:branch"
            required
            contractOwnerDid="did:example:owner"
            setTerm={setTerm}
            term={{ sharing: true, shareAll: true, shared: ['approved-snapshot'] }}
        />
    );
    expect(screen.getByRole('heading', { name: 'Branch of service' })).toBeVisible();
    expect(screen.queryByRole('radio', { name: 'Keep private' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Allow once' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(setTerm).toHaveBeenCalledWith({
        sharing: true,
        shareAll: false,
        shared: ['approved-snapshot'],
    });
    expect(mocks.closeModal).toHaveBeenCalledOnce();
    expect(mocks.getList).not.toHaveBeenCalled();
});
