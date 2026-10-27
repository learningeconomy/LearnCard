import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { getIdFromUri } from '@helpers/uri.helpers';
import { getConsentFlowContractVersionRecord } from '@accesslayer/consentflowcontract/versions';
import { getContractTermsByUri } from '@accesslayer/consentflowcontract/relationships/read';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';

const setup = async (expiresAt?: string) => {
    const suffix = randomBytes(5).toString('hex');
    const owner = await getUser(randomBytes(32).toString('hex'));
    const learner = await getUser(randomBytes(32).toString('hex'));
    await owner.clients.fullAuth.profile.createProfile({ profileId: `version-owner-${suffix}` });
    await learner.clients.fullAuth.profile.createProfile({ profileId: `version-user-${suffix}` });
    const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
        name: 'Version QA',
        contract: normalContract,
        expiresAt,
    });
    const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
        contractUri: uri,
        terms: normalFullTerms,
    });
    return { owner, learner, uri, termsUri };
};

describe('safe live contract patches', () => {
    it('merges every scope map and preserves existing grants unless explicitly removed', async () => {
        const { owner, uri, termsUri } = await setup();
        const result = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: {
                contract: {
                    read: {
                        credentials: { categories: { Transcript: { required: false } } },
                        personal: { nickname: { required: false } },
                    },
                    write: {
                        credentials: { categories: { Certificate: { required: false } } },
                        personal: { phone: { required: false } },
                    },
                },
            },
        });
        expect(result.kind).toBe('expanded_optional');
        const current = await getConsentFlowContractVersionRecord(getIdFromUri(uri), 2);
        expect(current?.contract.read.credentials.categories).toMatchObject(
            normalContract.read.credentials.categories
        );
        expect(current?.contract.write.credentials.categories).toMatchObject(
            normalContract.write.credentials.categories
        );
        expect(current?.contract.read.personal).toMatchObject(normalContract.read.personal);
        expect(current?.contract.write.personal).toMatchObject(normalContract.write.personal);
        const granted = (await getContractTermsByUri(termsUri))!.terms;
        expect(granted.status).toBe('live');
        expect(granted.terms.read.personal).toMatchObject(normalFullTerms.read.personal);
        expect(granted.terms.read.credentials.categories.ID).toEqual(
            normalFullTerms.read.credentials.categories.ID
        );
        expect(granted.terms.write.credentials.categories.Certificate).toBe(false);
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { contract: { read: { credentials: { categories: {} } } } },
        });
        expect(
            (await getContractTermsByUri(termsUri))!.terms.terms.read.credentials.categories.ID
        ).toEqual(normalFullTerms.read.credentials.categories.ID);
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { contract: { read: { credentials: { categories: { ID: null } } } } },
        });
        const removed = (await getContractTermsByUri(termsUri))!.terms;
        expect(removed.terms.read.credentials.categories.ID).toBeUndefined();
        expect(removed.terms.read.credentials.categories.Achievement).toEqual(
            normalFullTerms.read.credentials.categories.Achievement
        );
    });

    it('clears expiry explicitly without changing the ticket-approved quiet-extension policy', async () => {
        const { owner, uri, termsUri } = await setup('2100-01-01T00:00:00.000Z');
        const result = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { expiresAt: null },
        });
        expect(result.kind).toBe('relaxed');
        expect(
            (await getConsentFlowContractVersionRecord(getIdFromUri(uri), 2))?.expiresAt
        ).toBeUndefined();
        expect((await getContractTermsByUri(termsUri))!.terms.status).toBe('live');
    });

    it.each(['writer', 'autoboost'] as const)(
        'rejects an unknown %s without committing or retaining a lock',
        async kind => {
            const { owner, uri } = await setup();
            const changes =
                kind === 'writer'
                    ? { writers: ['missing-writer'] }
                    : {
                          autoboosts: [
                              {
                                  id: 'missing-boost',
                                  signingAuthorityEndpoint: 'http://localhost:5000/api',
                                  signingAuthorityName: 'default',
                              },
                          ],
                      };
            await expect(
                owner.clients.fullAuth.contracts.updateConsentFlowContract({
                    uri,
                    changes,
                    reason: 'Test requested access',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            const state = await neogma.queryRunner.run(
                `MATCH (contract:ConsentFlowContract {id:$id}) RETURN contract.currentVersion AS version, contract._contractVersionLock AS lock`,
                { id: getIdFromUri(uri) }
            );
            expect(Number(state.records[0]!.get('version'))).toBe(1);
            expect(state.records[0]!.get('lock')).toBeNull();
            expect(await getConsentFlowContractVersionRecord(getIdFromUri(uri), 2)).toBeNull();
        }
    );

    it('removes the final requested scope without making the request unreadable', async () => {
        const { owner, learner } = await setup();
        const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Single option',
            contract: {
                read: { credentials: { categories: {} }, personal: {} },
                write: { credentials: { categories: { Only: { required: false } } }, personal: {} },
            },
        });
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri: uri,
            terms: {
                read: { credentials: { categories: {} }, personal: {} },
                write: { credentials: { categories: { Only: true } }, personal: {} },
            },
        });
        await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri,
            changes: { contract: { write: { credentials: { categories: { Only: null } } } } },
        });
        const current = await getConsentFlowContractVersionRecord(getIdFromUri(uri), 2);
        expect(current?.contract.write.credentials.categories).toEqual({});
        const terms = (await getContractTermsByUri(termsUri))!.terms;
        expect(terms.status).toBe('live');
        expect(terms.terms.write.credentials.categories).toEqual({});
    });
});
