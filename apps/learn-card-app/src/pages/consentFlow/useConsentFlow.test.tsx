import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import type { ConsentFlowContractDetails, ConsentFlowTermsStatus } from '@learncard/types';
import useConsentFlow from './useConsentFlow';

const state = vi.hoisted(() => ({
    status: 'live' as ConsentFlowTermsStatus,
    closeAllModals: vi.fn(),
    newModal: vi.fn(),
}));
const contract = {
    uri: 'lc:contract',
    name: 'Partner request',
    owner: { did: 'did:example:partner' },
} as ConsentFlowContractDetails;
vi.mock('learn-card-base', () => ({
    useModal: () => ({ newModal: state.newModal, closeAllModals: state.closeAllModals }),
    useContract: () => ({}),
    useConsentedContracts: () => ({
        data: [{ uri: 'lc:terms', contract, status: state.status }],
    }),
    useUpdateTerms: () => ({}),
    ModalTypes: { Cancel: 'cancel', FullScreen: 'fullscreen' },
    getLogger: () => ({ info: vi.fn() }),
}));
vi.mock('./FullScreenConsentFlow', () => ({ default: () => null }));
vi.mock('./GameFlow/FullScreenGameFlow', () => ({ default: () => null }));

const Launcher = () => {
    const { openConsentFlowModal } = useConsentFlow(contract);
    return <button onClick={() => openConsentFlowModal()}>Open request</button>;
};

beforeEach(() => {
    vi.clearAllMocks();
    state.status = 'live';
});
afterEach(cleanup);

it.each(['needs_reconsent', 'suspended'] as const)(
    'opens the required review for a %s connection before showing ordinary consent',
    async status => {
        state.status = status;
        const history = createMemoryHistory({ initialEntries: ['/consent-flow'] });
        render(
            <Router history={history}>
                <Launcher />
            </Router>
        );
        fireEvent.click(screen.getByRole('button', { name: 'Open request' }));
        await waitFor(() => expect(history.location.pathname).toBe('/consent-flow/review'));
        expect(new URLSearchParams(history.location.search).get('uri')).toBe(contract.uri);
        expect(state.closeAllModals).toHaveBeenCalledOnce();
        expect(state.newModal).not.toHaveBeenCalled();
    }
);

it('keeps an already approved connection on the ordinary consent path', async () => {
    const history = createMemoryHistory({ initialEntries: ['/consent-flow'] });
    render(
        <Router history={history}>
            <Launcher />
        </Router>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open request' }));
    await waitFor(() => expect(state.newModal).toHaveBeenCalledOnce());
    expect(history.location.pathname).toBe('/consent-flow');
    expect(state.closeAllModals).not.toHaveBeenCalled();
});
