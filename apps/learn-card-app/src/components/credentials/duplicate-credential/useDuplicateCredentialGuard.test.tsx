import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import type { DuplicateCredentialLookup } from './findDuplicateCredential';
import type { DuplicateCredentialResolution } from './useDuplicateCredentialGuard';
import { useDuplicateCredentialGuard } from './useDuplicateCredentialGuard';

const mocks = vi.hoisted(() => ({
    findDuplicateCredential: vi.fn(),
    initWallet: vi.fn(),
    warn: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({}),
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ warn: mocks.warn }),
    useWallet: () => ({ initWallet: mocks.initWallet }),
}));

vi.mock('learn-card-base/react-query/queries/vcQueries', () => ({
    getOrFetchResolvedCredential: vi.fn(),
}));

vi.mock('./findDuplicateCredential', () => ({
    findDuplicateCredential: mocks.findDuplicateCredential,
}));

vi.mock('./DuplicateCredentialPrompt', () => ({
    DuplicateCredentialPrompt: ({
        onChoose,
    }: {
        onChoose: (action: 'save' | 'skip' | 'cancel') => void;
    }) => (
        <div role="dialog" aria-label="Duplicate credential">
            <button onClick={() => onChoose('save')}>Save Another Copy</button>
            <button onClick={() => onChoose('skip')}>Skip This Copy</button>
            <button onClick={() => onChoose('cancel')}>Cancel</button>
        </div>
    ),
}));
const incomingCredential = {
    id: 'urn:uuid:incoming',
    type: ['VerifiableCredential'],
} as VC;
const existingMatch = {
    credential: incomingCredential,
    record: { uri: 'lc:credential:existing' },
};

type RequestDuplicateResolution = (
    credential: VC,
    lookup?: DuplicateCredentialLookup
) => Promise<DuplicateCredentialResolution>;

let requestDuplicateResolution: RequestDuplicateResolution;

const Harness = () => {
    const guard = useDuplicateCredentialGuard();
    requestDuplicateResolution = guard.requestDuplicateResolution;

    return (
        <>
            <output>{guard.isCheckingDuplicate ? 'checking' : 'idle'}</output>
            {guard.duplicateCredentialPrompt}
        </>
    );
};

const requestResolution = (): Promise<DuplicateCredentialResolution> => {
    let promise!: Promise<DuplicateCredentialResolution>;
    act(() => {
        promise = requestDuplicateResolution(incomingCredential);
    });
    return promise;
};
const requestImmediateResolution = async (
    lookup?: DuplicateCredentialLookup
): Promise<DuplicateCredentialResolution> => {
    let resolution!: DuplicateCredentialResolution;
    await act(async () => {
        resolution = await requestDuplicateResolution(incomingCredential, lookup);
    });
    return resolution;
};

describe('useDuplicateCredentialGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.initWallet.mockResolvedValue({});
        mocks.findDuplicateCredential.mockResolvedValue(null);
    });

    it('continues without prompting when no saved credential matches', async () => {
        render(<Harness />);

        await expect(requestImmediateResolution()).resolves.toEqual({
            action: 'save',
            isDuplicate: false,
        });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    it('forwards a claim-link Boost URI to the wallet lookup', async () => {
        render(<Harness />);

        await requestImmediateResolution({
            boostUri: 'lc:network:example.org/trpc:boost:boost-id',
        });

        expect(mocks.findDuplicateCredential).toHaveBeenCalledWith(
            expect.any(Object),
            incomingCredential,
            { boostUri: 'lc:network:example.org/trpc:boost:boost-id' },
            expect.any(Function)
        );
    });

    it('reports when it is checking the wallet for a duplicate', async () => {
        let resolveCheck!: (match: null) => void;
        mocks.findDuplicateCredential.mockReturnValue(
            new Promise<null>(resolve => {
                resolveCheck = resolve;
            })
        );
        render(<Harness />);

        const resolution = requestResolution();
        expect(screen.getByText('checking')).toBeVisible();

        await act(async () => resolveCheck(null));
        await expect(resolution).resolves.toEqual({ action: 'save', isDuplicate: false });
        expect(screen.getByText('idle')).toBeVisible();
    });

    it.each([
        ['Save Another Copy', { action: 'save', isDuplicate: true }],
        ['Skip This Copy', { action: 'skip', isDuplicate: true }],
        ['Cancel', { action: 'cancel', isDuplicate: true }],
    ] as const)(
        'returns the explicit %s decision for a duplicate',
        async (buttonName, expected) => {
            mocks.findDuplicateCredential.mockResolvedValue(existingMatch);
            render(<Harness />);

            const resolution = requestResolution();
            await screen.findByRole('dialog', { name: 'Duplicate credential' });
            fireEvent.click(screen.getByRole('button', { name: buttonName }));

            await expect(resolution).resolves.toEqual(expected);
        }
    );

    it('fails open when the wallet duplicate check is temporarily unavailable', async () => {
        mocks.findDuplicateCredential.mockRejectedValue(new Error('offline'));
        render(<Harness />);

        await expect(requestImmediateResolution()).resolves.toEqual({
            action: 'save',
            isDuplicate: false,
        });
        expect(mocks.warn).toHaveBeenCalledWith(
            'Unable to check for an existing credential',
            expect.any(Error)
        );
    });

    it('cancels a pending decision when the claim surface unmounts', async () => {
        mocks.findDuplicateCredential.mockResolvedValue(existingMatch);
        const { unmount } = render(<Harness />);

        const resolution = requestResolution();
        await screen.findByRole('dialog', { name: 'Duplicate credential' });
        unmount();

        await expect(resolution).resolves.toEqual({ action: 'cancel', isDuplicate: true });
    });

    it('cancels when the claim surface unmounts during the wallet check', async () => {
        const { promise: check, resolve: resolveCheck } = Promise.withResolvers<
            typeof existingMatch | null
        >();
        mocks.findDuplicateCredential.mockReturnValue(check);
        const { unmount } = render(<Harness />);

        const resolution = requestResolution();
        unmount();
        await act(async () => resolveCheck(null));

        await expect(resolution).resolves.toEqual({ action: 'cancel', isDuplicate: false });
    });
});
