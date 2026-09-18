import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storageUri = 'ceramic://encrypted-presentation';
const displayCredential = {
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    credentialSubject: { id: 'did:example:holder', achievement: { name: 'First Aid' } },
};
const credential = {
    id: 'urn:uuid:credential',
    boostId: 'urn:boost:test',
    boostCredential: displayCredential,
};

const mocks = vi.hoisted(() => ({
    readCredential: vi.fn(),
    useGetCredentialWithEdits: vi.fn(() => ({ credentialWithEdits: undefined })),
    verifyCredential: vi.fn(),
    unwrapBoostCredential: vi.fn(),
    presentAlert: vi.fn(),
    logWarn: vi.fn(),
    setCredentialInfo: vi.fn(),
    credentialInfo: undefined as
        { uri: string; seed: string; pin: string; credentialId?: string } | undefined,
    requestModalProps: [] as Record<string, unknown>[],
}));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: vi.fn() }),
    useLocation: () => ({
        search: `?uri=${encodeURIComponent(storageUri)}&seed=seed&pin=1234`,
    }),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@capacitor/browser', () => ({ Browser: { open: vi.fn() } }));
vi.mock('@learncard/react', () => ({ getVCDisplayCardVariant: () => 'default' }));
vi.mock('@ionic/react', () => ({
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonToolbar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useIonAlert: () => [mocks.presentAlert],
    useIonModal: () => [vi.fn(), vi.fn()],
}));
vi.mock('learn-card-base', () => ({
    BrandingEnum: { learncard: 'learncard' },
    getLogger: () => ({ info: vi.fn(), warn: mocks.logWarn }),
    useGetCredentialWithEdits: mocks.useGetCredentialWithEdits,
    useIsLoggedIn: () => false,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getEndorsementTargetId: async (value: { id?: string }) =>
        value.id ?? `urn:sha256:${'a'.repeat(64)}`,
    getDefaultCategoryForCredential: () => 'Achievement',
    getEndorsementsFromPresentations: () => [],
    isClrCredential: () => false,
    unwrapBoostCredential: mocks.unwrapBoostCredential,
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: async () => ({
        read: { get: mocks.readCredential },
        invoke: { verifyCredential: mocks.verifyCredential },
    }),
}));
vi.mock('../accessibility/AccessibleBoostFooterLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('./SharedBoostVerificationBlock', () => ({
    default: () => null,
    SharedBoostVerificationBlockViewMode: { mini: 'mini', modal: 'modal' },
}));
vi.mock('learn-card-base/components/loaders/LoadingSpinner', () => ({
    LoadingSpinner: () => null,
}));
vi.mock('../main-header/MainHeader', () => ({ default: () => null }));
vi.mock('../boost-endorsements/EndorsementRequestModal/EndorsementRequestModal', () => ({
    default: (props: Record<string, unknown>) => {
        mocks.requestModalProps.push(props);
        return null;
    },
}));
vi.mock('learn-card-base/components/headerBranding/HeaderBranding', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: () => null,
}));
vi.mock('./SharedBoostPageFooter', () => ({ default: () => null }));
vi.mock('../clr-transcript/surfaces/ClrTranscriptFullPage', () => ({ default: () => null }));
vi.mock('../../helpers/clrRenderer.helpers', () => ({
    ClrTranscriptSurface: { Full: 'full' },
    normalizeClrTranscriptDisplayModel: () => null,
}));
vi.mock('../../hooks/deriveLifecycleStatus', () => ({
    deriveLifecycleStatus: () => 'active',
}));
vi.mock('../../stores/endorsementsRequestStore', () => ({
    default: {
        useTracked: {
            credentialInfo: () => mocks.credentialInfo,
            endorsementRequest: () => undefined,
        },
        set: {
            credentialInfo: mocks.setCredentialInfo,
        },
    },
}));
vi.mock('../boost-endorsements/EndorsementRequestForm/EndorsementDraftRequestSuccess', () => ({
    default: () => null,
}));
vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'http://localhost:3000',
}));
vi.mock('../boost-endorsements/EndorsementRequestForm/endorsement-request.helpers', () => ({
    createEndorsementShareLinkInfo: () => 'share-link',
}));
vi.mock('../../paraglide/messages.js', () => ({
    'endorsement.viewRequest.errorOpening': () => 'Unable to open credential',
    'issue.revoked': () => 'Revoked',
    'issue.suspended': () => 'Suspended',
}));

import ViewSharedBoost from './ViewSharedBoost';

describe('ViewSharedBoost', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.credentialInfo = {
            uri: storageUri,
            seed: 'seed',
            pin: '1234',
            credentialId: credential.id,
        };
        mocks.requestModalProps.length = 0;
        mocks.unwrapBoostCredential.mockImplementation(value =>
            (value as { boostCredential?: unknown }).boostCredential
                ? (value as { boostCredential: unknown }).boostCredential
                : value
        );
        mocks.readCredential.mockResolvedValue({ verifiableCredential: credential });
        mocks.verifyCredential.mockResolvedValue([]);
    });

    it('does not pass the encrypted presentation URI as a Boost edit fallback', async () => {
        render(<ViewSharedBoost showEndorsementRequest />);

        await waitFor(() =>
            expect(mocks.useGetCredentialWithEdits).toHaveBeenCalledWith(displayCredential)
        );
        expect(
            mocks.useGetCredentialWithEdits.mock.calls.every(arguments_ => arguments_.length === 1)
        ).toBe(true);
    });

    it('passes only the verified credential id as the endorsement target', async () => {
        render(<ViewSharedBoost showEndorsementRequest />);

        await waitFor(() =>
            expect(mocks.requestModalProps).toContainEqual(
                expect.objectContaining({
                    credential: displayCredential,
                    targetCredential: { id: credential.id },
                })
            )
        );
        expect(mocks.setCredentialInfo).toHaveBeenCalledWith({
            uri: storageUri,
            seed: 'seed',
            pin: '1234',
            credentialId: credential.id,
        });
    });

    it('derives and stores a verified target id for an idless shared credential', async () => {
        const idlessCredential = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:holder' },
            proof: { type: 'Ed25519Signature2020', proofValue: 'zExample' },
        };
        mocks.credentialInfo = {
            uri: storageUri,
            seed: 'seed',
            pin: '1234',
        };
        mocks.readCredential.mockResolvedValue({ verifiableCredential: idlessCredential });

        render(<ViewSharedBoost showEndorsementRequest />);

        await waitFor(() =>
            expect(mocks.requestModalProps).toContainEqual(
                expect.objectContaining({
                    credential: idlessCredential,
                    targetCredential: {
                        id: expect.stringMatching(/^urn:sha256:[0-9a-f]{64}$/),
                    },
                })
            )
        );

        const targetCredential = mocks.requestModalProps.find(props =>
            (props.targetCredential as { id?: string })?.id?.startsWith('urn:sha256:')
        )?.targetCredential as { id: string };
        expect(mocks.setCredentialInfo).toHaveBeenCalledWith({
            uri: storageUri,
            seed: 'seed',
            pin: '1234',
            credentialId: targetCredential.id,
        });
    });

    it('rejects a request credential id that does not match the shared wrapper', async () => {
        mocks.credentialInfo = {
            uri: storageUri,
            seed: 'seed',
            pin: '1234',
            credentialId: 'urn:uuid:other',
        };

        render(<ViewSharedBoost showEndorsementRequest />);

        await waitFor(() => expect(mocks.presentAlert).toHaveBeenCalledOnce());
        expect(mocks.logWarn).toHaveBeenCalledWith(
            'Unable to open shared credential',
            expect.objectContaining({
                message: 'The endorsement request does not match the shared credential',
            })
        );
        expect(mocks.setCredentialInfo).not.toHaveBeenCalled();
        expect(mocks.requestModalProps.some(props => Boolean(props.targetCredential))).toBe(false);
    });

    it('ignores stale endorsement state on the normal share route', async () => {
        mocks.credentialInfo = {
            uri: 'ceramic://stale-endorsement-presentation',
            seed: 'stale-seed',
            pin: '0000',
            credentialId: 'urn:uuid:stale',
        };

        render(<ViewSharedBoost />);

        await waitFor(() => expect(mocks.readCredential).toHaveBeenCalledWith(storageUri));
        expect(mocks.readCredential).not.toHaveBeenCalledWith(
            'ceramic://stale-endorsement-presentation'
        );
    });
});
