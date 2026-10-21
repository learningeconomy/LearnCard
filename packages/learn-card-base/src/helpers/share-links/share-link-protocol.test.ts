import { describe, expect, it } from 'vitest';

import {
    AcknowledgeViewInputValidator,
    AcknowledgeViewOutputValidator,
    CreateShareLinkInputValidator,
    MAX_SELECTED_CREDENTIALS,
    MAX_SHARE_CIPHERTEXT_BYTES,
    MAX_SHARE_RECOVERY_JWE_BYTES,
    MAX_VP_MEMBERS,
    ShareCiphertextValidator,
    ShareContentKeyValidator,
    ShareEnvelopeValidator,
    ShareIvValidator,
    ShareLinkIdValidator,
    ShareLinkPublicStateValidator,
    ShareOwnerRecoveryValidator,
    SharePayloadValidator,
    ShareRecoveryPlaintextValidator,
    UpdateShareLinkInputValidator,
    encodeBase64Url,
    isCanonicalBase64Url,
    utf8ByteLength,
} from '@learncard/types';

const bytes = (length: number, fill = 0): Uint8Array => new Uint8Array(length).fill(fill);

// All-zero ids/keys end in the canonical all-zero character, so a trailing `B`
// is a same-bytes, non-canonical alias (unused padding bits).
const SHARE_ID = encodeBase64Url(bytes(16));
const CONTENT_KEY = encodeBase64Url(bytes(32));
const IV = encodeBase64Url(bytes(12, 3));
const MIN_CT = encodeBase64Url(bytes(16, 4));
const NOW = '2026-01-01T00:00:00.000Z';

const PROOF = {
    type: 'Ed25519Signature2018',
    created: NOW,
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:web:issuer.example#key-1',
    jws: 'zSignature',
};

const vc = (id: string) => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id,
    type: ['VerifiableCredential'],
    issuer: 'did:web:issuer.example',
    credentialSubject: { id: 'did:web:holder.example' },
    proof: PROOF,
});

const endorsementVc = (id: string, targetId: string) => ({
    ...vc(id),
    type: ['VerifiableCredential', 'EndorsementCredential'],
    credentialSubject: { id: targetId },
});

const vp = (credentials: unknown[]) => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: 'VerifiablePresentation',
    holder: 'did:web:holder.example',
    verifiableCredential: credentials,
    proof: { ...PROOF, proofPurpose: 'authentication' },
});

const basePayload = (credentials: unknown[] = [vc('urn:lc:credential:sel-0')]) => ({
    protocol: 'lc-share/v1',
    shareId: SHARE_ID,
    contentVersion: 1,
    createdAt: NOW,
    sharer: { profileId: 'profile-1', displayName: 'Sharer' },
    presentation: vp(credentials),
    selection: [{ credentialIndex: 0 }],
    endorsements: [] as { credentialIndex: number; targetCredentialIndex: number }[],
});

const minimalJwe = (ciphertextBytes: number) => ({
    protected: 'eyJhbGciOiJFQ0RILUVTK0EyNTZLVyIsImVuYyI6IkEyNTZHQ00ifQ',
    iv: IV,
    ciphertext: encodeBase64Url(bytes(ciphertextBytes, 5)),
    tag: encodeBase64Url(bytes(16, 6)),
});

/** True when a permissive decoder maps both strings to the same bytes. */
const decodeAliasMatches = (alias: string, canonical: string): boolean => {
    const decoded = (value: string) => {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        return Array.from(
            atob(`${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`),
            char => char.charCodeAt(0)
        ).join(',');
    };
    return decoded(alias) === decoded(canonical);
};

describe('canonical base64url protocol fields', () => {
    it('accepts canonical id/key/iv and rejects wrong decoded lengths', () => {
        expect(ShareLinkIdValidator.safeParse(SHARE_ID).success).toBe(true);
        expect(ShareContentKeyValidator.safeParse(CONTENT_KEY).success).toBe(true);
        expect(ShareIvValidator.safeParse(IV).success).toBe(true);

        expect(ShareLinkIdValidator.safeParse(encodeBase64Url(bytes(15))).success).toBe(false);
        expect(ShareContentKeyValidator.safeParse(encodeBase64Url(bytes(31))).success).toBe(false);
        expect(ShareIvValidator.safeParse(encodeBase64Url(bytes(8))).success).toBe(false);
    });

    it('rejects padding, standard base64 and non-canonical trailing-bit aliases', () => {
        expect(ShareLinkIdValidator.safeParse(`${SHARE_ID}=`).success).toBe(false);
        expect(ShareLinkIdValidator.safeParse(SHARE_ID.slice(0, 21)).success).toBe(false);

        const alias = `${SHARE_ID.slice(0, 21)}B`;
        expect(decodeAliasMatches(alias, SHARE_ID)).toBe(true);
        expect(isCanonicalBase64Url(alias, 16)).toBe(false);
        expect(ShareLinkIdValidator.safeParse(alias).success).toBe(false);

        const keyAlias = `${CONTENT_KEY.slice(0, 42)}B`;
        expect(isCanonicalBase64Url(keyAlias, 32)).toBe(false);
        expect(ShareContentKeyValidator.safeParse(keyAlias).success).toBe(false);
    });

    it('bounds ciphertext: 16-byte tag minimum, 512 KiB decoded maximum (tag included)', () => {
        expect(ShareCiphertextValidator.safeParse(MIN_CT).success).toBe(true);
        expect(ShareCiphertextValidator.safeParse(encodeBase64Url(bytes(15))).success).toBe(false);
        expect(ShareCiphertextValidator.safeParse(encodeBase64Url(bytes(16, 4))).success).toBe(
            true
        );

        const atCap = encodeBase64Url(bytes(MAX_SHARE_CIPHERTEXT_BYTES, 7));
        const overCap = encodeBase64Url(bytes(MAX_SHARE_CIPHERTEXT_BYTES + 1, 7));
        expect(ShareCiphertextValidator.safeParse(atCap).success).toBe(true);
        expect(ShareCiphertextValidator.safeParse(overCap).success).toBe(false);
    });
});

/** True when a permissive decoder maps both strings to the same 16 bytes. */
describe('AES-GCM envelope validator', () => {
    it('rejects unknown version/algorithm and extra fields', () => {
        const envelope = { v: 1, alg: 'A256GCM', iv: IV, ct: MIN_CT };

        expect(ShareEnvelopeValidator.safeParse(envelope).success).toBe(true);
        expect(ShareEnvelopeValidator.safeParse({ ...envelope, v: 2 }).success).toBe(false);
        expect(ShareEnvelopeValidator.safeParse({ ...envelope, alg: 'A128CBC' }).success).toBe(
            false
        );
        expect(ShareEnvelopeValidator.safeParse({ ...envelope, extra: true }).success).toBe(false);
    });
});

describe('recipient manifest structural classification', () => {
    it('accepts a fully classified manifest and preserves selected order', () => {
        const payload = basePayload([vc('urn:lc:credential:sel-0'), vc('urn:lc:credential:sel-1')]);
        payload.selection = [{ credentialIndex: 1 }, { credentialIndex: 0 }];

        const parsed = SharePayloadValidator.safeParse(payload);
        expect(parsed.success).toBe(true);
        expect(parsed.success && parsed.data.selection.map(entry => entry.credentialIndex)).toEqual(
            [1, 0]
        );
    });

    it('rejects duplicate and out-of-bounds selection indices', () => {
        const duplicate = basePayload();
        duplicate.selection = [{ credentialIndex: 0 }, { credentialIndex: 0 }];
        expect(SharePayloadValidator.safeParse(duplicate).success).toBe(false);

        const outOfBounds = basePayload();
        outOfBounds.selection = [{ credentialIndex: 4 }];
        expect(SharePayloadValidator.safeParse(outOfBounds).success).toBe(false);
    });

    it('rejects an unclassified (smuggled) VP member', () => {
        const payload = basePayload([vc('urn:lc:credential:sel-0'), vc('urn:lc:credential:extra')]);
        expect(SharePayloadValidator.safeParse(payload).success).toBe(false);
    });

    it('rejects a source URI smuggled into index-only manifest entries', () => {
        const payload = basePayload() as ReturnType<typeof basePayload> & {
            selection: { credentialIndex: number; ref?: string }[];
        };
        payload.selection = [{ credentialIndex: 0, ref: 'urn:lc:credential:sel-0' }];
        expect(SharePayloadValidator.safeParse(payload).success).toBe(false);
    });

    it('binds each endorsement target through its own signed claim', () => {
        const valid = basePayload([
            vc('urn:lc:credential:sel-0'),
            endorsementVc('urn:uuid:endorsement-1', 'urn:lc:credential:sel-0'),
        ]);
        valid.endorsements = [{ credentialIndex: 1, targetCredentialIndex: 0 }];
        expect(SharePayloadValidator.safeParse(valid).success).toBe(true);

        const wrongTarget = basePayload([
            vc('urn:lc:credential:sel-0'),
            vc('urn:lc:credential:sel-1'),
            endorsementVc('urn:uuid:endorsement-1', 'urn:lc:credential:sel-0'),
        ]);
        wrongTarget.endorsements = [{ credentialIndex: 2, targetCredentialIndex: 1 }];
        expect(SharePayloadValidator.safeParse(wrongTarget).success).toBe(false);

        const unbound = basePayload([
            vc('urn:lc:credential:sel-0'),
            {
                ...endorsementVc('urn:uuid:endorsement-1', 'urn:lc:credential:sel-0'),
                credentialSubject: {},
            },
        ]);
        unbound.endorsements = [{ credentialIndex: 1, targetCredentialIndex: 0 }];
        expect(SharePayloadValidator.safeParse(unbound).success).toBe(false);
    });

    it('enforces bounded selection, endorsement and VP-member totals', () => {
        const tooManySelected = basePayload();
        tooManySelected.selection = Array.from({ length: MAX_SELECTED_CREDENTIALS + 1 }, () => ({
            credentialIndex: 0,
        }));
        expect(SharePayloadValidator.safeParse(tooManySelected).success).toBe(false);

        const tooManyEndorsements = basePayload([vc('urn:lc:credential:sel-0')]);
        tooManyEndorsements.endorsements = Array.from({ length: 201 }, () => ({
            credentialIndex: 0,
            targetCredentialIndex: 0,
        }));
        expect(SharePayloadValidator.safeParse(tooManyEndorsements).success).toBe(false);

        const tooManyMembers = basePayload(
            Array.from({ length: MAX_VP_MEMBERS + 1 }, (_, index) =>
                vc(`urn:lc:credential:${index}`)
            )
        );
        expect(SharePayloadValidator.safeParse(tooManyMembers).success).toBe(false);
    });
});

describe('owner recovery schema', () => {
    const recovery = (overrides: Record<string, unknown> = {}) => ({
        protocol: 'lc-share-recovery/v1',
        shareId: SHARE_ID,
        ownerProfileId: 'profile-1',
        createdAt: NOW,
        latest: { contentVersion: 1, key: CONTENT_KEY },
        selection: [{ ref: 'urn:lc:credential:sel-0', order: 0 }],
        endorsements: [],
        ...overrides,
    });

    it('accepts a well-formed recovery and rejects unknown fields', () => {
        expect(ShareRecoveryPlaintextValidator.safeParse(recovery()).success).toBe(true);
        expect(
            ShareRecoveryPlaintextValidator.safeParse(recovery({ secret: 'nope' })).success
        ).toBe(false);
    });

    it('requires unique in-bounds selection order values', () => {
        expect(
            ShareRecoveryPlaintextValidator.safeParse(
                recovery({
                    selection: [
                        { ref: 'urn:lc:credential:sel-0', order: 0 },
                        { ref: 'urn:lc:credential:sel-1', order: 0 },
                    ],
                })
            ).success
        ).toBe(false);

        expect(
            ShareRecoveryPlaintextValidator.safeParse(
                recovery({ selection: [{ ref: 'urn:lc:credential:sel-0', order: 1 }] })
            ).success
        ).toBe(false);
    });

    it('caps the serialized recovery JWE at 64 KiB, not the plaintext', () => {
        // 50 KiB of decoded ciphertext is under the 64 KiB byte cap, but its
        // base64url + JSON serialization exceeds it, so the encoded form is what
        // is enforced.
        expect(ShareOwnerRecoveryValidator.safeParse(minimalJwe(30 * 1024)).success).toBe(true);
        expect(ShareOwnerRecoveryValidator.safeParse(minimalJwe(50 * 1024)).success).toBe(false);

        const accepted = utf8ByteLength(JSON.stringify(minimalJwe(30 * 1024)));
        const rejected = utf8ByteLength(JSON.stringify(minimalJwe(50 * 1024)));
        expect(accepted).toBeLessThanOrEqual(MAX_SHARE_RECOVERY_JWE_BYTES);
        expect(rejected).toBeGreaterThan(MAX_SHARE_RECOVERY_JWE_BYTES);
    });
});

describe('owner input validators', () => {
    const envelope = { v: 1, alg: 'A256GCM', iv: IV, ct: MIN_CT };

    it('create requires a version-1 envelope plus owner recovery', () => {
        const valid = {
            id: SHARE_ID,
            clientRequestId: '3f1c9e2a-1b2c-4d5e-8f90-123456789abc',
            title: 'My achievements',
            selectedCount: 1,
            contentVersion: 1,
            envelope,
            ownerEncryptedRecovery: minimalJwe(128),
        };
        expect(CreateShareLinkInputValidator.safeParse(valid).success).toBe(true);
        expect(
            CreateShareLinkInputValidator.safeParse({ ...valid, contentVersion: 2 }).success
        ).toBe(false);
        expect(
            CreateShareLinkInputValidator.safeParse({ ...valid, ownerProfileId: 'foreign' }).success
        ).toBe(false);
    });

    it('update requires all four content fields together and rejects owner-supplied state', () => {
        const metadataOnly = {
            id: SHARE_ID,
            expectedVersion: 1,
            clientRequestId: '3f1c9e2a-1b2c-4d5e-8f90-123456789abc',
            title: 'New title',
        };
        expect(UpdateShareLinkInputValidator.safeParse(metadataOnly).success).toBe(true);

        const partial = { ...metadataOnly, contentVersion: 2 };
        expect(UpdateShareLinkInputValidator.safeParse(partial).success).toBe(false);

        const full = {
            ...metadataOnly,
            contentVersion: 2,
            selectedCount: 1,
            envelope,
            ownerEncryptedRecovery: minimalJwe(128),
        };
        expect(UpdateShareLinkInputValidator.safeParse(full).success).toBe(true);

        expect(
            UpdateShareLinkInputValidator.safeParse({ ...metadataOnly, viewCount: 99 }).success
        ).toBe(false);
    });

    it('public state never carries age-policy fields', () => {
        const active = {
            state: 'active',
            id: SHARE_ID,
            title: 'Share',
            selectedCount: 1,
            contentVersion: 1,
            contentUrl: 'https://example.test/content',
            sharer: { displayName: 'Sharer' },
            createdAt: NOW,
            updatedAt: NOW,
            expiresAt: null,
        };
        expect(ShareLinkPublicStateValidator.safeParse(active).success).toBe(true);
        expect(
            ShareLinkPublicStateValidator.safeParse({ ...active, viewCountingEnabled: true })
                .success
        ).toBe(false);
    });

    it('acknowledgement receipts are bounded base64url tokens', () => {
        expect(
            AcknowledgeViewInputValidator.safeParse({ receipt: encodeBase64Url(bytes(32)) }).success
        ).toBe(true);
        expect(AcknowledgeViewInputValidator.safeParse({ receipt: 'short' }).success).toBe(false);
        expect(AcknowledgeViewInputValidator.safeParse({ receipt: '!'.repeat(32) }).success).toBe(
            false
        );
    });
});

describe('review regressions', () => {
    it('preserves extension fields inside the signed presentation', () => {
        const credential = {
            ...vc('urn:selected'),
            renderMethod: {
                type: 'TemplateRenderMethod',
                renderSuite: 'svg',
                template: 'urn:template',
                customSignedField: 'must survive parsing',
                outputPreference: { mediaType: 'image/svg+xml', customSignedField: true },
            },
        };
        const input = basePayload([credential]);
        expect(SharePayloadValidator.parse(input).presentation).toEqual(input.presentation);
    });

    it('allows endorsement targets anywhere in the VP, not just the first 50 slots', () => {
        const selected = vc('urn:selected');
        const credentials = Array.from({ length: 50 }, (_, i) =>
            endorsementVc(`urn:e:${i}`, selected.id)
        );
        const input = basePayload([...credentials, selected]);
        input.selection = [{ credentialIndex: 50 }];
        input.endorsements = credentials.map((_, credentialIndex) => ({
            credentialIndex,
            targetCredentialIndex: 50,
        }));
        expect(SharePayloadValidator.safeParse(input).success).toBe(true);
    });
});

describe('privacy and recursive bounds', () => {
    it('exposes only a uniform acknowledgement', () => {
        expect(AcknowledgeViewOutputValidator.parse({ ok: true })).toEqual({ ok: true });
        expect(AcknowledgeViewOutputValidator.safeParse({ counted: true }).success).toBe(false);
        expect(AcknowledgeViewOutputValidator.safeParse({ ok: true, counted: false }).success).toBe(
            false
        );
    });
    it('bounds nested credentials, not only top-level VP members', () => {
        const nested = {
            ...vc('urn:clr'),
            credentialSubject: {
                verifiableCredential: Array.from({ length: MAX_VP_MEMBERS }, () => vc('urn:inner')),
            },
        };
        expect(SharePayloadValidator.safeParse(basePayload([nested])).success).toBe(false);
    });
});
