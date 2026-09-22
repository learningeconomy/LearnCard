import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    readCredential: vi.fn(),
    useGetCredentialWithEdits: vi.fn(() => ({ credentialWithEdits: undefined })),
    verifyCredential: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useLocation: () => ({}) }));
vi.mock('@ionic/react', () => ({ useIonAlert: () => [vi.fn()] }));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ info: vi.fn(), warn: vi.fn() }),
    useGetCredentialWithEdits: mocks.useGetCredentialWithEdits,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
    unwrapBoostCredential: (credential: unknown) => credential,
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: async () => ({
        read: { get: mocks.readCredential },
        invoke: { verifyCredential: mocks.verifyCredential },
    }),
}));
vi.mock('../EndorsementForm/EndorsementFormHeader', () => ({ default: () => null }));
vi.mock('../EndorsementsList/EndorsementReviewFooter', () => ({ default: () => null }));
vi.mock('../EndorsementsList/EndorsementFullView', () => ({ default: () => null }));
vi.mock('../EndorsementForm/EndorsementFormBoostPreviewCard', () => ({ default: () => null }));
vi.mock('../boost-endorsement.helpers', () => ({
    EndorsementModeEnum: { Review: 'review' },
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'common.cancel': () => 'Cancel',
    'endorsement.viewRequest.errorOpening': () => 'Unable to open endorsement',
    'endorsement.viewRequest.ok': () => 'OK',
}));

import ViewEndorsementRequest from './ViewEndorsementRequest';

const storageUri = 'ceramic://encrypted-presentation';
const credential = { id: 'urn:uuid:credential', boostId: 'urn:boost:test' };

describe('ViewEndorsementRequest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.readCredential.mockResolvedValue({ verifiableCredential: credential });
        mocks.verifyCredential.mockResolvedValue([]);
    });

    it('does not pass the encrypted presentation URI as a Boost edit fallback', async () => {
        render(
            <ViewEndorsementRequest sharedLink={{ uri: storageUri, seed: 'seed', pin: '1234' }} />
        );

        await waitFor(() =>
            expect(mocks.useGetCredentialWithEdits).toHaveBeenCalledWith(credential)
        );
        expect(
            mocks.useGetCredentialWithEdits.mock.calls.every(arguments_ => arguments_.length === 1)
        ).toBe(true);
    });
});
