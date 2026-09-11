import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SdJwtVcFixture } from '@learncard/credential-library';

const { uploadEncrypted, addToIndex, materialize, wallet } = vi.hoisted(() => {
    const upload = vi.fn().mockResolvedValue('lc:test:course-completion');
    const add = vi.fn().mockResolvedValue(undefined);
    const materializer = vi.fn().mockResolvedValue({
        compact: 'issuer-signed-compact~',
        envelope: { format: 'dc+sd-jwt', data: 'issuer-signed-compact~' },
        vct: 'https://credentials.learncard.com/vct/course-completion',
    });
    const learnCard = {
        addPlugin: vi.fn(),
        id: {
            did: () => 'did:key:issuer',
            keypair: () => ({
                kty: 'OKP',
                crv: 'Ed25519',
                x: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                d: 'private',
            }),
        },
        invoke: {
            didToVerificationMethod: vi.fn().mockResolvedValue('did:key:issuer#key-1'),
            getProfile: vi.fn().mockResolvedValue(null),
        },
        store: { LearnCloud: { uploadEncrypted: upload } },
        index: { LearnCloud: { add } },
    };

    learnCard.addPlugin.mockResolvedValue(learnCard);

    return {
        uploadEncrypted: upload,
        addToIndex: add,
        materialize: materializer,
        wallet: learnCard,
    };
});

vi.mock('@learncard/init', () => ({ initLearnCard: vi.fn().mockResolvedValue(wallet) }));
vi.mock('@learncard/lca-api-plugin', () => ({
    getLCAPlugin: vi.fn().mockResolvedValue({ isOffline: false }),
}));
vi.mock('@learncard/sd-jwt-vc-plugin', () => ({
    createEd25519KbSigner: vi.fn().mockResolvedValue(async () => 'signature'),
}));
vi.mock('@learncard/credential-library', async importOriginal => ({
    ...(await importOriginal<typeof import('@learncard/credential-library')>()),
    materializeSdJwtVcFixture: materialize,
}));

import { useWallet, WalletProvider } from './WalletContext';

const fixture: SdJwtVcFixture = {
    kind: 'sd-jwt-vc',
    id: 'sd-jwt-vc/course-completion',
    name: 'Course Completion',
    description: 'Test fixture',
    spec: 'sd-jwt-vc',
    profile: 'course',
    features: ['selective-disclosure', 'holder-binding'],
    source: 'synthetic',
    signed: false,
    validity: 'valid',
    template: {
        format: 'dc+sd-jwt',
        vct: 'https://credentials.learncard.com/vct/course-completion',
        claims: { course_name: 'Verifiable Credentials' },
        selectivelyDisclosable: ['course_name'],
    },
};

describe('WalletProvider SD-JWT storage', () => {
    beforeEach(() => {
        uploadEncrypted.mockClear();
        addToIndex.mockClear();
        materialize.mockClear();

        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: {
                getItem: () => null,
                setItem: () => {},
                removeItem: () => {},
            },
        });
    });

    it('indexes only versioned metadata and leaves the compact body in storage', async () => {
        let context: ReturnType<typeof useWallet> | undefined;

        const CaptureContext = (): null => {
            context = useWallet();
            return null;
        };

        renderToStaticMarkup(
            <WalletProvider>
                <CaptureContext />
            </WalletProvider>
        );

        if (!context) throw new Error('Expected wallet context');

        await context.connect('test-seed');
        await context.materializeAndStoreSdJwt(fixture);

        expect(uploadEncrypted).toHaveBeenCalledWith({
            format: 'dc+sd-jwt',
            data: 'issuer-signed-compact~',
        });
        expect(addToIndex).toHaveBeenCalledTimes(1);

        const indexRecord = addToIndex.mock.calls[0]?.[0];

        expect(indexRecord).toEqual({
            id: expect.stringMatching(/^urn:uuid:/),
            uri: 'lc:test:course-completion',
            category: 'Learning History',
            format: 'dc+sd-jwt',
            semanticType: 'https://credentials.learncard.com/vct/course-completion',
            __v: 1,
        });
    });
});
