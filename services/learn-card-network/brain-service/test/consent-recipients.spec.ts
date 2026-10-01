import { beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { Profile, ConsentFlowContract } from '@models';
import { createConsentFlowContract } from '@accesslayer/consentflowcontract/create';
import { getIdFromUri } from '@helpers/uri.helpers';
import {
    getContractTermsByUri,
    getConsentedDataForContract,
} from '@accesslayer/consentflowcontract/relationships/read';
import { syncCredentialsToContract } from '@accesslayer/consentflowcontract/relationships/update';
import { testUnsignedBoost, testVc } from './helpers/send';
import { openApiDocument } from '../src/openapi';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `audience-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId, did: (await user.clients.fullAuth.profile.getProfile())!.did };
};

describe('contract data recipients', () => {
    let owner: Awaited<ReturnType<typeof actor>>;
    let recipient: Awaited<ReturnType<typeof actor>>;
    let learner: Awaited<ReturnType<typeof actor>>;
    let outsider: Awaited<ReturnType<typeof actor>>;
    beforeEach(async () => {
        [owner, recipient, learner, outsider] = await Promise.all([
            actor('owner'),
            actor('recipient'),
            actor('learner'),
            actor('outsider'),
        ]);
    });
    const create = (recipients: string[] = []) =>
        owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic audience contract',
            contract: normalContract,
            recipients,
        });
    const accept = async (contractUri: string, audienceVersion?: number) =>
        learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: normalFullTerms,
            audienceVersion,
        });
    const details = (uri: string) =>
        owner.clients.fullAuth.contracts.getConsentFlowContract({ uri });

    it('deduplicates recipients, excludes the owner, resolves DIDs and strips private profile fields', async () => {
        await Profile.update(
            { email: 'synthetic-private@example.com' },
            { where: { profileId: recipient.profileId } }
        );
        const uri = await create([recipient.profileId, recipient.did, owner.profileId]);
        const result = await details(uri);
        expect(result.recipients?.map(profile => profile.profileId)).toEqual([recipient.profileId]);
        expect(result.audienceVersion).toBe(1);
        expect(result.recipients![0]).not.toHaveProperty('email');
    });

    it('validates writers and autoboosts before creating any contract or audience', async () => {
        const name = `atomic-validation-${owner.profileId}`;
        for (const configuration of [
            { writers: ['missing-writer'] },
            {
                autoboosts: [
                    {
                        boostUri: 'lc:boost:localhost:missing-boost',
                        signingAuthority: { endpoint: 'https://example.com', name: 'missing' },
                    },
                ],
            },
        ]) {
            await expect(
                owner.clients.fullAuth.contracts.createConsentFlowContract({
                    name,
                    contract: normalContract,
                    recipients: [recipient.profileId],
                    ...configuration,
                })
            ).rejects.toThrow();
            expect(await ConsentFlowContract.findMany({ where: { name } })).toHaveLength(0);
        }
    });

    it('creates no partial contract if a referenced recipient disappears before the atomic write', async () => {
        const name = `atomic-missing-${owner.profileId}`;
        await expect(
            createConsentFlowContract({
                name,
                contract: normalContract,
                ownerProfileId: owner.profileId,
                recipientIds: [recipient.profileId, 'missing-recipient'],
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(await ConsentFlowContract.findMany({ where: { name } })).toHaveLength(0);
    });

    it('rolls back the contract and all relationships if a later configuration write fails', async () => {
        const boostUri = await owner.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        const name = `atomic-rollback-${owner.profileId}`;
        await expect(
            createConsentFlowContract({
                name,
                contract: normalContract,
                ownerProfileId: owner.profileId,
                recipientIds: [recipient.profileId],
                writerIds: [outsider.profileId],
                autoboosts: [
                    {
                        id: getIdFromUri(boostUri),
                        signingAuthorityName: 'synthetic',
                        // Neo4j rejects map-valued properties after the preceding writes.
                        signingAuthorityEndpoint: { invalid: true } as unknown as string,
                    },
                ],
            })
        ).rejects.toThrow();
        expect(await ConsentFlowContract.findMany({ where: { name } })).toHaveLength(0);
    });

    it('keeps audience versions monotonic when a recipient is added and removed before consent', async () => {
        const uri = await create();
        await owner.clients.fullAuth.contracts.addContractRecipient({
            contractUri: uri,
            recipient: recipient.profileId,
        });
        await owner.clients.fullAuth.contracts.removeContractRecipient({
            contractUri: uri,
            recipient: recipient.profileId,
        });
        expect((await details(uri)).recipients).toEqual([]);
        expect((await details(uri)).audienceVersion).toBe(2);
        await expect(accept(uri)).rejects.toMatchObject({ code: 'CONFLICT' });
        await accept(uri, 2);
    });

    it('includes public recipients in consent listings, including empty legacy audiences', async () => {
        await Profile.update(
            { email: 'synthetic-private@example.com' },
            { where: { profileId: recipient.profileId } }
        );
        const uri = await create([recipient.profileId]);
        await accept(uri, 1);
        const legacyUri = await create();
        await accept(legacyUri);
        const records = (await learner.clients.fullAuth.contracts.getConsentedContracts()).records;
        const listed = records.find(record => record.contract.uri === uri)!.contract;
        expect(listed.recipients?.map(profile => profile.profileId)).toEqual([recipient.profileId]);
        expect(listed.recipients![0]).not.toHaveProperty('email');
        expect(
            records.find(record => record.contract.uri === legacyUri)!.contract.recipients
        ).toEqual([]);
    });

    it('rejects missing and stale acknowledgments without recording consent', async () => {
        const uri = await create([recipient.profileId]);
        await expect(accept(uri)).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(accept(uri, 0)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect((await learner.clients.fullAuth.contracts.getConsentedContracts()).records).toEqual(
            []
        );
        await accept(uri, 1);
    });

    it('allows permitted data reads for recipients but grants no admin or writer rights', async () => {
        const uri = await create([recipient.profileId]);
        await accept(uri, 1);
        const routes = recipient.clients.fullAuth.contracts;
        const query = { id: uri.split(':').at(-1)! };
        expect((await routes.getConsentedDataForContract({ uri })).records).toHaveLength(1);
        expect(
            (await routes.getConsentedDataForDid({ did: learner.did, query })).records
        ).toHaveLength(1);
        expect((await routes.getConsentedData()).records).toHaveLength(1);
        await expect(
            routes.addContractRecipient({ contractUri: uri, recipient: outsider.profileId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            routes.removeContractRecipient({ contractUri: uri, recipient: recipient.profileId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(routes.deleteConsentFlowContract({ uri })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        const boostUri = await recipient.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        await expect(
            routes.writeCredentialToContract({
                did: learner.did,
                contractUri: uri,
                boostUri,
                credential: testVc,
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            outsider.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(
            (await outsider.clients.fullAuth.contracts.getConsentedDataForDid({ did: learner.did }))
                .records
        ).toEqual([]);
        expect((await outsider.clients.fullAuth.contracts.getConsentedData()).records).toEqual([]);
    });

    it('keeps explicitly added writers out of the data audience', async () => {
        const uri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Writer isolation',
            contract: normalContract,
            writers: [outsider.profileId],
            recipients: [recipient.profileId],
        });
        await accept(uri, 1);
        await expect(
            outsider.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect((await outsider.clients.fullAuth.contracts.getConsentedData()).records).toEqual([]);
    });

    it('removal stops recipient discovery and rejects old client updates and syncs while owner access remains', async () => {
        const uri = await create([recipient.profileId]);
        const { termsUri } = await accept(uri, 1);
        await owner.clients.fullAuth.contracts.removeContractRecipient({
            contractUri: uri,
            recipient: recipient.profileId,
        });
        expect((await details(uri)).audienceVersion).toBe(2);
        await expect(
            recipient.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(
            (
                await recipient.clients.fullAuth.contracts.getConsentedDataForDid({
                    did: learner.did,
                })
            ).records
        ).toEqual([]);
        expect((await recipient.clients.fullAuth.contracts.getConsentedData()).records).toEqual([]);
        expect(
            (await owner.clients.fullAuth.contracts.getConsentedDataForContract({ uri })).records
        ).toHaveLength(1);
        for (const audienceVersion of [undefined, 1]) {
            await expect(
                learner.clients.fullAuth.contracts.updateConsentedContractTerms({
                    uri: termsUri,
                    terms: normalFullTerms,
                    audienceVersion,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
            await expect(
                learner.clients.fullAuth.contracts.syncCredentialsToContract({
                    termsUri,
                    categories: { Achievement: ['urn:stale:copy'] },
                    audienceVersion,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        }
        await learner.clients.fullAuth.contracts.syncCredentialsToContract({
            termsUri,
            categories: { Achievement: ['urn:current:copy'] },
            audienceVersion: 2,
        });
        expect(
            JSON.stringify(
                await owner.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
            )
        ).not.toContain('urn:stale:copy');
    });

    it('freezes additions after first consent even following withdrawal and all recipient removals', async () => {
        const uri = await create([recipient.profileId]);
        const { termsUri } = await accept(uri, 1);
        await learner.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });
        await owner.clients.fullAuth.contracts.removeContractRecipient({
            contractUri: uri,
            recipient: recipient.profileId,
        });
        await expect(
            owner.clients.fullAuth.contracts.addContractRecipient({
                contractUri: uri,
                recipient: outsider.profileId,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect((await details(uri)).recipients).toEqual([]);
    });

    it('pre-consent addition is idempotent and invalidates the previous version', async () => {
        const uri = await create();
        await owner.clients.fullAuth.contracts.addContractRecipient({
            contractUri: uri,
            recipient: recipient.profileId,
        });
        await owner.clients.fullAuth.contracts.addContractRecipient({
            contractUri: uri,
            recipient: recipient.profileId,
        });
        expect((await details(uri)).audienceVersion).toBe(1);
        await expect(accept(uri, 0)).rejects.toMatchObject({ code: 'CONFLICT' });
        await accept(uri, 1);
    });

    it.each([1, 2, 3, 4, 5])(
        'serializes first consent versus recipient addition (attempt %s)',
        async () => {
            const uri = await create();
            const results = await Promise.allSettled([
                accept(uri, 0),
                owner.clients.fullAuth.contracts.addContractRecipient({
                    contractUri: uri,
                    recipient: recipient.profileId,
                }),
            ]);
            expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
            const audience = await details(uri);
            const history = await learner.clients.fullAuth.contracts.getConsentedContracts();
            if (results[0]!.status === 'fulfilled') {
                expect(audience.recipients).toEqual([]);
                expect(history.records).toHaveLength(1);
            } else {
                expect(audience.recipients).toHaveLength(1);
                expect(history.records).toEqual([]);
            }
        }
    );

    it('rejects a sync snapshot prepared before a consent edit, without restoring disabled sharing', async () => {
        const uri = await create([recipient.profileId]);
        const { termsUri } = await accept(uri, 1);
        const snapshot = (await getContractTermsByUri(termsUri))!;
        const terms = structuredClone(normalFullTerms);
        terms.read.credentials.categories.Achievement!.sharing = false;
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms,
            audienceVersion: 1,
        });
        await expect(
            syncCredentialsToContract(snapshot, { Achievement: ['urn:stale:snapshot'] }, 1)
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        const current = (await getContractTermsByUri(termsUri))!;
        expect(current.terms.terms.read.credentials.categories.Achievement!.sharing).toBe(false);
        expect(
            JSON.stringify(
                await recipient.clients.fullAuth.contracts.getConsentedDataForContract({ uri })
            )
        ).not.toContain('urn:stale:snapshot');
    });

    it('rechecks membership in the data query after an earlier authorization decision', async () => {
        const uri = await create([recipient.profileId]);
        await accept(uri, 1);
        const id = uri.split(':').at(-1)!;
        expect(
            await getConsentedDataForContract(id, recipient.profileId, { limit: 10 })
        ).toHaveLength(1);
        await owner.clients.fullAuth.contracts.removeContractRecipient({
            contractUri: uri,
            recipient: recipient.profileId,
        });
        expect(await getConsentedDataForContract(id, recipient.profileId, { limit: 10 })).toEqual(
            []
        );
        expect(await getConsentedDataForContract(id, owner.profileId, { limit: 10 })).toHaveLength(
            1
        );
    });

    it('includes recipient endpoints and audience acknowledgements in generated OpenAPI', () => {
        const schema = JSON.stringify(openApiDocument);
        expect(openApiDocument.paths?.['/consent-flow-contract/recipient/add']?.post).toBeTruthy();
        expect(
            openApiDocument.paths?.['/consent-flow-contract/recipient/remove']?.post
        ).toBeTruthy();
        expect(schema).toContain('audienceVersion');
        expect(schema).toContain('recipients');
    });

    it('recipient access also stops on withdrawal', async () => {
        const uri = await create([recipient.profileId]);
        const { termsUri } = await accept(uri, 1);
        await learner.clients.fullAuth.contracts.withdrawConsent({ uri: termsUri });
        expect(
            (await recipient.clients.fullAuth.contracts.getConsentedDataForContract({ uri }))
                .records
        ).toEqual([]);
        expect(
            (
                await recipient.clients.fullAuth.contracts.getConsentedDataForDid({
                    did: learner.did,
                })
            ).records
        ).toEqual([]);
        expect((await recipient.clients.fullAuth.contracts.getConsentedData()).records).toEqual([]);
    });

    it('encrypts real data for owner and recipient; an outsider and removed recipient cannot decrypt new copies', async () => {
        const payload = { id: 'urn:synthetic:audience', value: 'Synthetic outcome' };
        const shared = await learner.learnCard.invoke.createDagJwe(payload, [
            owner.learnCard.id.did(),
            recipient.learnCard.id.did(),
        ]);
        expect(await owner.learnCard.invoke.decryptDagJwe(shared)).toEqual(payload);
        expect(await recipient.learnCard.invoke.decryptDagJwe(shared)).toEqual(payload);
        await expect(outsider.learnCard.invoke.decryptDagJwe(shared)).resolves.toBe('');
        const afterRemoval = await learner.learnCard.invoke.createDagJwe(payload, [
            owner.learnCard.id.did(),
        ]);
        expect(await owner.learnCard.invoke.decryptDagJwe(afterRemoval)).toEqual(payload);
        await expect(recipient.learnCard.invoke.decryptDagJwe(afterRemoval)).resolves.toBe('');
    });
});
