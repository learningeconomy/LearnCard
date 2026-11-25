import { describe, expect, it, vi } from 'vitest';

import { encodeBase64Url, type VC } from '@learncard/types';

import {
    SHARE_CREDENTIAL_CATEGORIES_CONTEXT,
    SHARE_MANIFEST_PROOF_VERIFICATION_PENDING,
    buildShareManifest,
    decryptSharePayload,
    encryptSharePayload,
    getShareCredentialCategories,
    validateShareManifest,
    verifyShareManifestProofs,
} from './index';

const SHARE_ID = encodeBase64Url(new Uint8Array(16).fill(21));
const NOW = '2026-01-01T00:00:00.000Z';

const PROOF = {
    type: 'Ed25519Signature2018',
    created: NOW,
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:web:issuer.example#key-1',
    jws: 'zSignature',
};

const selectedVc = (sourceId: string) => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: sourceId,
    type: ['VerifiableCredential'],
    issuer: 'did:web:issuer.example',
    credentialSubject: { id: 'did:web:holder.example' },
    proof: PROOF,
});

const endorsementVc = (id: string, targetId: string) => ({
    ...selectedVc(id),
    type: ['VerifiableCredential', 'EndorsementCredential'],
    credentialSubject: { id: targetId },
});

const presentation = (credentials: VC[]) => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: 'VerifiablePresentation',
    holder: 'did:web:holder.example',
    verifiableCredential: credentials,
    proof: { ...PROOF, proofPurpose: 'authentication' },
});

const deepFreeze = <T>(value: T): T => {
    if (value && typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach(deepFreeze);
        Object.freeze(value);
    }
    return value;
};

const baseInput = () => {
    const selected = [selectedVc('urn:lc:credential:sel-0'), selectedVc('urn:lc:credential:sel-1')];
    const endorsement = endorsementVc('urn:uuid:endorsement-1', 'urn:lc:credential:sel-0');

    return {
        shareId: SHARE_ID,
        contentVersion: 4,
        createdAt: NOW,
        sharer: { profileId: 'profile-1', displayName: 'Sharer' },
        presentation: presentation([...selected, endorsement]),
        selection: [{ credentialIndex: 0 }, { credentialIndex: 1 }],
        endorsements: [{ credentialIndex: 2, targetCredentialIndex: 0 }],
    };
};

describe('recipient manifest construction and validation', () => {
    it('builds and validates a fully classified, ordered manifest', () => {
        const input = baseInput();
        const manifest = buildShareManifest(input);
        const result = validateShareManifest(manifest, { shareId: SHARE_ID, contentVersion: 4 });

        expect(result.ok).toBe(true);
        expect(result.ok && result.classification).toEqual({
            selectedIndices: [0, 1],
            endorsementIndices: [2],
            memberCount: 3,
        });
    });

    it('preserves credential contents by reference and preserves selection order', () => {
        const selected = [selectedVc('urn:lc:credential:sel-0')];
        const endorsement = endorsementVc('urn:uuid:endorsement-1', 'urn:lc:credential:sel-0');
        const input = {
            shareId: SHARE_ID,
            contentVersion: 1,
            createdAt: NOW,
            sharer: { profileId: 'p', displayName: 'D' },
            presentation: presentation([selected[0], endorsement]),
            selection: [{ credentialIndex: 0 }],
            endorsements: [{ credentialIndex: 1, targetCredentialIndex: 0 }],
        };

        const manifest = buildShareManifest(input);

        expect(manifest.presentation).toBe(input.presentation);
        expect(manifest.presentation.verifiableCredential[1]).toBe(endorsement);
        expect(manifest.selection[0]).not.toBe(input.selection[0]);
        expect(manifest.selection[0]).toEqual({ credentialIndex: 0 });
    });

    it('preserves owner-declared selection order', () => {
        const input = baseInput();
        input.selection = [{ credentialIndex: 1 }, { credentialIndex: 0 }];

        const manifest = buildShareManifest(input);
        expect(manifest.selection.map(entry => entry.credentialIndex)).toEqual([1, 0]);

        const result = validateShareManifest(manifest, { shareId: SHARE_ID, contentVersion: 4 });
        expect(result.ok && result.classification.selectedIndices).toEqual([1, 0]);
    });

    it('rejects partial, duplicate and out-of-bounds selections', () => {
        const input = baseInput();
        input.selection = [{ credentialIndex: 0 }];
        expect(
            validateShareManifest(buildShareManifest(input), {
                shareId: SHARE_ID,
                contentVersion: 4,
            })
        ).toMatchObject({ ok: false, code: 'UNCLASSIFIED_VP_MEMBER' });

        const duplicate = baseInput();
        duplicate.selection = [{ credentialIndex: 0 }, { credentialIndex: 0 }];
        expect(
            validateShareManifest(buildShareManifest(duplicate), {
                shareId: SHARE_ID,
                contentVersion: 4,
            })
        ).toMatchObject({ ok: false, code: 'SELECTION_INDEX_DUPLICATE' });

        const outOfBounds = baseInput();
        outOfBounds.selection = [{ credentialIndex: 9 }];
        expect(
            validateShareManifest(buildShareManifest(outOfBounds), {
                shareId: SHARE_ID,
                contentVersion: 4,
            })
        ).toMatchObject({ ok: false, code: 'SELECTION_INDEX_OUT_OF_BOUNDS' });
    });

    it('rejects source URIs smuggled into index-only entries', () => {
        const manifest = buildShareManifest(baseInput());
        const smuggled = {
            ...manifest,
            selection: [
                { credentialIndex: 0, ref: 'urn:lc:credential:sel-0' },
                { credentialIndex: 1 },
            ],
        };

        expect(
            validateShareManifest(smuggled, { shareId: SHARE_ID, contentVersion: 4 })
        ).toMatchObject({ ok: false, code: 'INVALID_MANIFEST' });
    });

    it('rejects unbound or non-selected endorsement targets', () => {
        const wrongTarget = baseInput();
        wrongTarget.endorsements = [{ credentialIndex: 2, targetCredentialIndex: 1 }];
        expect(
            validateShareManifest(buildShareManifest(wrongTarget), {
                shareId: SHARE_ID,
                contentVersion: 4,
            })
        ).toMatchObject({ ok: false, code: 'ENDORSEMENT_TARGET_UNBOUND' });

        const notSelected = baseInput();
        notSelected.endorsements = [{ credentialIndex: 2, targetCredentialIndex: 0 }];
        notSelected.selection = [{ credentialIndex: 1 }];
        expect(
            validateShareManifest(buildShareManifest(notSelected), {
                shareId: SHARE_ID,
                contentVersion: 4,
            })
        ).toMatchObject({ ok: false, code: 'ENDORSEMENT_TARGET_NOT_SELECTED' });
    });

    it('binds the manifest to the expected share id and content version', () => {
        const manifest = buildShareManifest(baseInput());

        expect(
            validateShareManifest(manifest, {
                shareId: encodeBase64Url(new Uint8Array(16).fill(22)),
                contentVersion: 4,
            })
        ).toMatchObject({ ok: false, code: 'SHARE_ID_MISMATCH' });

        expect(
            validateShareManifest(manifest, { shareId: SHARE_ID, contentVersion: 5 })
        ).toMatchObject({ ok: false, code: 'VERSION_MISMATCH' });
    });

    it('never mutates its inputs', () => {
        const input = deepFreeze(baseInput());

        const manifest = buildShareManifest(input);
        const result = validateShareManifest(manifest, { shareId: SHARE_ID, contentVersion: 4 });

        expect(result.ok).toBe(true);
        expect(input.selection).toEqual([{ credentialIndex: 0 }, { credentialIndex: 1 }]);
    });

    it.each(['Achievement', 'Job', 'Work Experience', 'Resume', 'Professional Title'])(
        'preserves signed %s categories and originals through encrypted manifest round trips',
        async category => {
            const input = deepFreeze(baseInput());
            const manifest = buildShareManifest({
                ...input,
                presentation: {
                    ...input.presentation,
                    '@context': [
                        ...input.presentation['@context'],
                        SHARE_CREDENTIAL_CATEGORIES_CONTEXT,
                    ],
                    lcCredentialCategories: [category, null],
                },
            });
            const key = encodeBase64Url(new Uint8Array(32).fill(11));
            const envelope = await encryptSharePayload({
                shareId: SHARE_ID,
                contentVersion: 4,
                key,
                payload: manifest,
            });
            const decoded = await decryptSharePayload({
                shareId: SHARE_ID,
                contentVersion: 4,
                key,
                envelope,
            });
            const result = validateShareManifest(decoded, { shareId: SHARE_ID, contentVersion: 4 });
            expect(result.ok).toBe(true);
            if (!result.ok) throw new Error(result.message);
            expect(getShareCredentialCategories(result.manifest.presentation)).toEqual([
                category,
                null,
            ]);
            expect(result.manifest.presentation.verifiableCredential).toEqual(
                input.presentation.verifiableCredential
            );
        }
    );

    it.each(['Unknown category', 'Verified by University', 'constructor', 'toString', '__proto__'])(
        'falls back to inference for unrecognized category %s without losing valid hints',
        category => {
            const input = baseInput();
            const metadata = deepFreeze(['Achievement', category, null]);
            const manifest = buildShareManifest({
                ...input,
                presentation: { ...input.presentation, lcCredentialCategories: metadata },
            });

            expect(getShareCredentialCategories(manifest.presentation)).toEqual([
                'Achievement',
                null,
                null,
            ]);
            expect(manifest.presentation.lcCredentialCategories).toEqual(metadata);
        }
    );

    it('ignores malformed optional categories without rejecting legacy or readable shares', () => {
        const legacy = buildShareManifest(baseInput());
        expect(getShareCredentialCategories(legacy.presentation)).toBeUndefined();
        for (const metadata of [
            {},
            [],
            [''],
            ['x'.repeat(129)],
            ['Achievement', null, null, 'ID'],
            Array(251).fill(null),
            ['Achievement', 3, null],
        ]) {
            const manifest = {
                ...legacy,
                presentation: { ...legacy.presentation, lcCredentialCategories: metadata },
            };
            expect(getShareCredentialCategories(manifest.presentation)).toBeUndefined();
            expect(
                validateShareManifest(manifest, { shareId: SHARE_ID, contentVersion: 4 }).ok
            ).toBe(true);
        }
    });

    it('exposes an explicit, injected proof-verification boundary', async () => {
        expect(SHARE_MANIFEST_PROOF_VERIFICATION_PENDING).toBe('wallet-vp-verification-required');

        const manifest = buildShareManifest(baseInput());
        const verifier = {
            verifyShareManifestProofs: vi.fn().mockResolvedValue({
                presentationVerified: true,
                credentialsVerified: true,
                endorsementsVerified: true,
                failures: [],
            }),
        };

        const result = await verifyShareManifestProofs(verifier, manifest);

        expect(result.presentationVerified).toBe(true);
        expect(verifier.verifyShareManifestProofs).toHaveBeenCalledWith(manifest);
    });
});
