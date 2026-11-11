import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JWE, VC } from '@learncard/types';
import type { Transaction } from 'neo4j-driver';

const mocks = vi.hoisted(() => ({
    decrypt: vi.fn(),
    issue: vi.fn(),
    store: vi.fn(async (_credential: unknown) => ({ id: 'stored' })),
    instanceOf: vi.fn(),
    sent: vi.fn(),
    contract: vi.fn(),
    listing: vi.fn(),
    accept: vi.fn(),
    notify: vi.fn(async () => undefined),
    signingAuthority: vi.fn(),
    release: vi.fn(),
    transaction: { run: vi.fn() },
}));

vi.mock('@instance', () => ({
    neogma: {
        getTransaction: async (
            _transaction: Transaction | null,
            action: (transaction: unknown) => Promise<unknown>
        ) => action(mocks.transaction),
    },
}));

vi.mock('@models', () => ({}));
vi.mock('@services/skills-provider/inject', () => ({
    injectObv3AlignmentsIntoCredentialForBoost: vi.fn(),
}));
vi.mock('@accesslayer/boost/relationships/read', () => ({}));
vi.mock('./uri.helpers', () => ({
    constructUri: (kind: string, id: string, domain: string) =>
        `lc:network:${domain}/${kind}:${id}`,
}));
vi.mock('@accesslayer/credential/create', () => ({ storeCredential: mocks.store }));
vi.mock('@accesslayer/credential/delete', () => ({ releaseUnlinkedCredential: mocks.release }));
vi.mock('@accesslayer/boost/relationships/create', () => ({
    createBoostInstanceOfRelationship: mocks.instanceOf,
}));
vi.mock('@accesslayer/credential/relationships/create', () => ({
    createSentCredentialRelationship: mocks.sent,
    createContractCredentialRelationships: mocks.contract,
    createListingSentCredentialRelationship: mocks.listing,
}));
vi.mock('./credential.helpers', () => ({
    acceptCredential: mocks.accept,
    getCredentialUri: (id: string, domain: string) => `lc:network:${domain}/credential:${id}`,
}));
vi.mock('./learnCard.helpers', () => ({
    getLearnCard: async () => ({
        id: { did: () => 'did:example:brain', keypair: () => ({}) },
        invoke: {
            decryptDagJwe: mocks.decrypt,
            issueCredential: mocks.issue,
            resolveDid: async () => ({}),
        },
    }),
}));
vi.mock('./signingAuthority.helpers', () => ({
    issueCredentialWithSigningAuthority: mocks.signingAuthority,
}));
vi.mock('./notifications.helpers', () => ({ addNotificationToQueue: mocks.notify }));
vi.mock('./notificationMessages', () => ({ getNotificationMessage: () => 'Received' }));
vi.mock('./getRecipientLocale.helpers', () => ({ resolveRecipientLocale: async () => 'en' }));
vi.mock('./did.helpers', () => ({
    getDidWeb: (domain: string, id: string) => `did:web:${domain}:users:${id}`,
}));
vi.mock('./status-list.helpers', () => ({
    appendBitstringStatusListEntries: async (credential: unknown) => credential,
}));
vi.mock('@tracing', () => ({
    trace: async (_kind: string, _name: string, action: () => unknown) => action(),
    traceDb: async (_name: string, action: () => unknown) => action(),
    traceCrypto: async (_name: string, action: () => unknown) => action(),
    traceInternal: async (_name: string, action: () => unknown) => action(),
}));

import {
    issueClaimLinkBoost,
    prepareCredentialFromBoost,
    sendBoost,
    stampIssuanceDate,
} from './boost.helpers';

const vc = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'BoostCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
    boostId: 'lc:network:network.example/boost:boost',
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key',
    },
} as VC;
const jwe: JWE = {
    protected: 'header',
    iv: 'iv',
    ciphertext: 'ciphertext',
    tag: 'tag',
    recipients: [],
};
const options = {
    from: { type: 'profile', profile: { profileId: 'org' } },
    to: { profileId: 'student' },
    boost: { dataValues: { id: 'boost', boost: JSON.stringify(vc) } },
    credential: jwe,
    domain: 'network.example',
    autoAcceptCredential: true,
    contractTerms: { id: 'terms' },
    listingId: 'listing',
    metadata: { source: 'test' },
    activityId: 'activity',
    integrationId: 'integration',
} as unknown as Parameters<typeof sendBoost>[0];

const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(complete => {
        resolve = complete;
    });
    return { promise, resolve };
};

describe('boost payload storage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.decrypt.mockResolvedValue(vc);
        mocks.issue.mockImplementation(async unsigned => ({ ...unsigned, proof: {} }));
    });

    it.each([
        ['encrypted', jwe],
        ['issuer-signed', vc],
        ['pre-signed without a Boost claim', { ...vc, boostId: undefined }],
        [
            'ordinary VC without a Boost claim',
            { ...vc, type: ['VerifiableCredential'], boostId: undefined },
        ],
        [
            'serialized issuance result',
            JSON.parse(
                JSON.stringify({ kind: 'issued-credential', credential: jwe, statusEntries: [] })
            ),
        ],
    ] as const)(
        'preserves %s bytes without decrypting or replacing the issuer signature',
        async (_kind, credential) => {
            const uri = await sendBoost({ ...options, credential });
            expect(uri).toBe('lc:network:network.example/credential:stored');
            expect(mocks.store.mock.calls[0]?.[0]).toBe(credential);
            expect(mocks.decrypt).not.toHaveBeenCalled();
            expect(mocks.issue).not.toHaveBeenCalled();
        }
    );

    it('does not overlap relationship writes that touch the same credential', async () => {
        const first = deferred();
        const sent = deferred();
        const listing = deferred();
        mocks.instanceOf.mockReturnValueOnce(first.promise);
        mocks.sent.mockReturnValueOnce(sent.promise);
        mocks.listing.mockReturnValueOnce(listing.promise);
        const result = sendBoost({ ...options, contractTerms: undefined });
        await vi.waitFor(() => expect(mocks.instanceOf).toHaveBeenCalledOnce());
        expect(mocks.sent).not.toHaveBeenCalled();
        first.resolve();
        await vi.waitFor(() => expect(mocks.sent).toHaveBeenCalledOnce());
        expect(mocks.listing).not.toHaveBeenCalled();
        sent.resolve();
        await vi.waitFor(() => expect(mocks.listing).toHaveBeenCalledOnce());
        expect(mocks.contract).not.toHaveBeenCalled();
        listing.resolve();
        await expect(result).resolves.toBe('lc:network:network.example/credential:stored');
        expect(mocks.contract).not.toHaveBeenCalled();
        expect(mocks.instanceOf.mock.calls[0]?.[2]).toBe(mocks.transaction);
        expect(mocks.sent.mock.calls[0]?.[6]).toBe(mocks.transaction);
        expect(mocks.listing.mock.calls[0]?.[6]).toBe(mocks.transaction);
    });

    it('releases a failed contract send so the same signed payload can be retried', async () => {
        let reserved = false;
        mocks.store
            .mockImplementationOnce(async () => {
                reserved = true;
                return { id: 'stored' };
            })
            .mockImplementationOnce(async () => {
                if (reserved) throw new Error('Status list index is already bound');
                return { id: 'retried' };
            });
        mocks.release.mockImplementationOnce(async () => {
            reserved = false;
        });
        const error = new Error('contract not approved');
        mocks.contract.mockRejectedValueOnce(error);
        await expect(sendBoost({ ...options, credential: vc })).rejects.toBe(error);
        expect(mocks.release).toHaveBeenCalledWith('stored');
        await expect(sendBoost({ ...options, credential: vc })).resolves.toBe(
            'lc:network:network.example/credential:retried'
        );
        expect(mocks.store.mock.calls[0]?.[0]).toBe(vc);
        expect(mocks.store.mock.calls[1]?.[0]).toBe(vc);
    });

    it('preserves the relationship error when cleanup fails', async () => {
        const error = new Error('relationship failed');
        mocks.contract.mockRejectedValueOnce(error);
        mocks.release.mockRejectedValueOnce(new Error('cleanup failed'));
        const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            await expect(sendBoost(options)).rejects.toBe(error);
            expect(log).toHaveBeenCalledWith('BOOST_UNLINKED_CREDENTIAL_CLEANUP_FAILED');
        } finally {
            log.mockRestore();
        }
    });

    it.each(['instanceOf', 'sent', 'listing', 'contract'] as const)(
        'stops after a failed %s graph write without acceptance or notification',
        async failed => {
            const error = new Error('graph write failed');
            mocks[failed].mockRejectedValueOnce(error);
            await expect(
                sendBoost({
                    ...options,
                    contractTerms: failed === 'contract' ? options.contractTerms : undefined,
                })
            ).rejects.toBe(error);
            if (failed === 'contract') {
                expect(mocks.instanceOf).not.toHaveBeenCalled();
                expect(mocks.sent).not.toHaveBeenCalled();
                expect(mocks.listing).not.toHaveBeenCalled();
            }
            const order = ['instanceOf', 'sent', 'listing', 'contract'] as const;
            for (const later of order.slice(order.indexOf(failed) + 1)) {
                expect(mocks[later]).not.toHaveBeenCalled();
            }
            expect(mocks.accept).not.toHaveBeenCalled();
            expect(mocks.notify).not.toHaveBeenCalled();
        }
    );

    it.each(['listing', 'another-listing', undefined])(
        'adds explicit listing attribution only when the listing issuer does not already cover %s',
        async listingId => {
            const from = {
                type: 'appStoreListing',
                listing: { listing_id: 'listing' },
                ownerProfile: { profileId: 'org' },
            } as Parameters<typeof sendBoost>[0]['from'];
            await sendBoost({ ...options, from, listingId, contractTerms: undefined });
            expect(mocks.sent).toHaveBeenCalledOnce();
            expect(mocks.listing).toHaveBeenCalledTimes(listingId === 'another-listing' ? 1 : 0);
        }
    );

    it('does not inspect template-derived fields or add a network signature', async () => {
        const credential = { ...vc, display: { backgroundColor: '#bad' } };
        await sendBoost({ ...options, credential });
        expect(mocks.store.mock.calls[0]?.[0]).toBe(credential);
        expect(mocks.decrypt).not.toHaveBeenCalled();
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it.each(['lc:network:network.example/boost:other', '', null])(
        'rejects a plaintext credential with an explicit conflicting boostId (%s) before storage',
        async boostId => {
            await expect(
                sendBoost({ ...options, credential: { ...vc, boostId } })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
            expect(mocks.store).not.toHaveBeenCalled();
            expect(mocks.instanceOf).not.toHaveBeenCalled();
            expect(mocks.sent).not.toHaveBeenCalled();
        }
    );

    it.each([
        ['Boost', ['VerifiableCredential', 'BoostCredential']],
        ['OBv3', ['VerifiableCredential', 'OpenBadgeCredential']],
        ['VC', ['VerifiableCredential']],
    ])(
        'issues a %s claim-link template with only supported Boost metadata',
        async (_kind, type) => {
            const issued = { kind: 'issued-credential', credential: jwe, statusEntries: [] };
            mocks.signingAuthority.mockResolvedValue(issued);
            const boost = {
                ...options.boost,
                dataValues: {
                    id: 'boost',
                    boost: JSON.stringify({
                        ...vc,
                        type,
                        boostId: undefined,
                        credentialSubject: [{ name: 'First' }, { name: 'Second' }],
                    }),
                },
            } as Parameters<typeof issueClaimLinkBoost>[0];
            const authority = { relationship: { did: 'did:example:sa' } } as Parameters<
                typeof issueClaimLinkBoost
            >[4];
            await issueClaimLinkBoost(boost, options.domain, options.from, options.to, authority);
            expect(mocks.signingAuthority.mock.calls[0]![1].credentialSubject).toEqual([
                { name: 'First', id: 'did:web:network.example:users:student' },
                { name: 'Second', id: 'did:web:network.example:users:student' },
            ]);
            const unsigned = mocks.signingAuthority.mock.calls[0]![1];
            if (type.includes('BoostCredential')) {
                expect(unsigned.boostId).toBe('lc:network:network.example/boost:boost');
            } else {
                expect(unsigned).not.toHaveProperty('boostId');
            }
            expect(mocks.store).toHaveBeenCalledWith(issued, mocks.transaction, 'org');
        }
    );

    describe('malformed template issuance dates', () => {
        // Seen on a production Boost template; it is not RFC 3339, so DIDKit refuses to sign it.
        const MALFORMED_DATE = '2025-10-19+053008:18:16';
        // The reused JOTA-JOTI "Health and Well-being" Boost that carried it.
        const BOOST_ID = 'e073d183-8304-419f-b4f6-ef91fda6524c';
        const V1 = ['https://www.w3.org/2018/credentials/v1'];
        const V2 = ['https://www.w3.org/ns/credentials/v2'];
        const authority = { relationship: { did: 'did:example:sa' } } as Parameters<
            typeof issueClaimLinkBoost
        >[4];
        const boostWith = (template: Record<string, unknown>) =>
            ({
                ...options.boost,
                dataValues: {
                    id: BOOST_ID,
                    boost: JSON.stringify({ ...vc, boostId: undefined, ...template }),
                },
            }) as Parameters<typeof issueClaimLinkBoost>[0];
        const expectFreshDate = (value: unknown, before: number) => {
            expect(typeof value).toBe('string');
            expect(value).toBe(new Date(value as string).toISOString());
            expect(Date.parse(value as string)).toBeGreaterThanOrEqual(before);
        };

        beforeEach(() => {
            mocks.signingAuthority.mockResolvedValue({
                kind: 'issued-credential',
                credential: jwe,
                statusEntries: [],
            });
        });

        it.each([
            [
                'VC 1.1 issuanceDate',
                { '@context': V1, issuanceDate: MALFORMED_DATE },
                'issuanceDate',
            ],
            [
                'VC 2.0 validFrom',
                { '@context': V2, issuanceDate: undefined, validFrom: MALFORMED_DATE },
                'validFrom',
            ],
        ] as const)(
            'restamps a malformed %s when a claim link is claimed',
            async (_kind, template, field) => {
                const before = Date.now();
                await issueClaimLinkBoost(
                    boostWith(template),
                    options.domain,
                    options.from,
                    options.to,
                    authority
                );
                const unsigned = mocks.signingAuthority.mock.calls[0]![1];
                expectFreshDate(unsigned[field], before);
            }
        );

        it('drops a stale issuanceDate left on a VC 2.0 template', async () => {
            const before = Date.now();
            await issueClaimLinkBoost(
                boostWith({ '@context': V2, issuanceDate: MALFORMED_DATE }),
                options.domain,
                options.from,
                options.to,
                authority
            );
            const unsigned = mocks.signingAuthority.mock.calls[0]![1];
            expectFreshDate(unsigned.validFrom, before);
            expect(unsigned).not.toHaveProperty('issuanceDate');
        });

        it('drops a stale issuanceDate left on a VC 2.0 template for direct sends', async () => {
            const before = Date.now();
            const credential = await prepareCredentialFromBoost(
                boostWith({ '@context': V2, issuanceDate: MALFORMED_DATE }),
                `lc:network:network.example/boost:${BOOST_ID}`,
                options.domain
            );
            expectFreshDate(credential.validFrom, before);
            expect(credential).not.toHaveProperty('issuanceDate');
        });

        it.each([
            { credentialSubject: { creditsEarned: 'not a number' } },
            { awardedDate: 'bad-date' },
        ])('reports invalid standard fields as BAD_REQUEST', async fields => {
            await expect(
                prepareCredentialFromBoost(
                    boostWith({
                        '@context': V2,
                        type: ['VerifiableCredential', 'OpenBadgeCredential'],
                        proof: undefined,
                        ...fields,
                    }),
                    `lc:network:network.example/boost:${BOOST_ID}`,
                    options.domain
                )
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it.each(['', '  '])(
            'omits blank awardedDate after template substitution %j',
            async completed => {
                const credential = await prepareCredentialFromBoost(
                    boostWith({
                        '@context': V2,
                        type: ['VerifiableCredential', 'OpenBadgeCredential'],
                        proof: undefined,
                        awardedDate: '{{completed}}',
                    }),
                    `lc:network:network.example/boost:${BOOST_ID}`,
                    options.domain,
                    { templateData: { completed } }
                );
                expect(credential).not.toHaveProperty('awardedDate');
            }
        );

        describe('display-only anchor detection', () => {
            const anchorBoostWith = (template: Record<string, unknown>) =>
                ({
                    dataValues: {
                        id: BOOST_ID,
                        boost: JSON.stringify({ ...vc, boostId: undefined, ...template }),
                    },
                }) as Parameters<typeof prepareCredentialFromBoost>[0];

            it("does not mistake an ordinary Boost's own display object for a display-only anchor", async () => {
                const credential = await prepareCredentialFromBoost(
                    anchorBoostWith({
                        display: {
                            backgroundColor: '#fff',
                            backgroundImage: '',
                            displayType: 'card',
                        },
                    }),
                    `lc:network:network.example/boost:${BOOST_ID}`,
                    options.domain
                );
                expect(credential.boostId).toBe(`lc:network:network.example/boost:${BOOST_ID}`);
            });

            it('rejects reusing a boost marked as a display-only anchor without an issuance credential', async () => {
                await expect(
                    prepareCredentialFromBoost(
                        anchorBoostWith({ displayOnlyAnchor: true, display: {} }),
                        `lc:network:network.example/boost:${BOOST_ID}`,
                        options.domain
                    )
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            });
        });

        describe('stampIssuanceDate', () => {
            const NOW = '2026-10-18T05:00:00.000Z';

            it('sets validFrom and removes issuanceDate on VC 2.0', () => {
                const stamped = stampIssuanceDate(
                    {
                        ...vc,
                        '@context': V2,
                        validFrom: MALFORMED_DATE,
                        issuanceDate: MALFORMED_DATE,
                    },
                    NOW
                );

                expect(stamped.validFrom).toBe(NOW);
                expect(stamped).not.toHaveProperty('issuanceDate');
            });

            it('only sets issuanceDate on VC 1.1', () => {
                const template = { ...vc, '@context': V1, issuanceDate: MALFORMED_DATE };

                expect(stampIssuanceDate({ ...template }, NOW)).toEqual({
                    ...template,
                    issuanceDate: NOW,
                });
            });
        });
    });

    it('preserves explicit notification and acceptance opt-outs', async () => {
        await sendBoost({
            ...options,
            skipNotification: true,
            autoAcceptCredential: false,
            contractTerms: undefined,
            listingId: undefined,
        });
        expect(mocks.store.mock.calls[0]?.[0]).toBe(jwe);
        expect(mocks.instanceOf).toHaveBeenCalledOnce();
        expect(mocks.sent).toHaveBeenCalledOnce();
        expect(mocks.accept).not.toHaveBeenCalled();
        expect(mocks.notify).not.toHaveBeenCalled();
        expect(mocks.contract).not.toHaveBeenCalled();
        expect(mocks.listing).not.toHaveBeenCalled();
    });
});
