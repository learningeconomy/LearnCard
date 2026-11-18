import { randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConsentFlowContract, ConsentFlowTerms } from '@learncard/types';
import * as notifications from '@helpers/notifications.helpers';
import { getContractTermsByUri } from '@accesslayer/consentflowcontract/relationships/read';
import { getUser } from './helpers/getClient';
import { normalContract, normalFullTerms } from './helpers/contract';
import { testUnsignedBoost } from './helpers/send';

/** LC-2423: write categories split into suggest-only and direct write. */

type User = Awaited<ReturnType<typeof getUser>>;

const contractWith = (canWrite?: boolean): ConsentFlowContract => {
    const contract = structuredClone(normalContract);
    contract.write.credentials.categories.Achievement = {
        required: false,
        ...(canWrite === undefined ? {} : { canWrite }),
    };
    return contract;
};

const termsWith = (canWrite?: boolean): ConsentFlowTerms => {
    const terms = structuredClone(normalFullTerms);
    if (canWrite !== undefined) terms.write.credentials.canWrite = { Achievement: canWrite };
    return terms;
};

const setup = async ({
    contractCanWrite,
    termsCanWrite,
}: { contractCanWrite?: boolean; termsCanWrite?: boolean } = {}) => {
    const suffix = randomBytes(5).toString('hex');
    const owner = await getUser(randomBytes(32).toString('hex'));
    const learner = await getUser(randomBytes(32).toString('hex'));
    await owner.clients.fullAuth.profile.createProfile({ profileId: `suggest-owner-${suffix}` });
    await learner.clients.fullAuth.profile.createProfile({ profileId: `suggest-user-${suffix}` });
    const contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
        name: 'Suggestions QA',
        contract: contractWith(contractCanWrite),
    });
    const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
        contractUri,
        terms: termsWith(termsCanWrite),
    });
    const boostUri = await owner.clients.fullAuth.boost.createBoost({
        credential: testUnsignedBoost,
        category: 'Achievement',
        name: 'Suggested Achievement',
    });
    return { owner, learner, contractUri, termsUri, boostUri };
};

const write = async (
    owner: User,
    learner: User,
    contractUri: string,
    boostUri: string,
    mode?: 'suggest'
) => {
    const credential = await owner.learnCard.invoke.issueCredential({
        ...testUnsignedBoost,
        issuer: owner.learnCard.id.did(),
        credentialSubject: {
            ...testUnsignedBoost.credentialSubject,
            id: learner.learnCard.id.did(),
        },
        boostId: boostUri,
    });
    return owner.clients.fullAuth.contracts.writeCredentialToContract({
        did: learner.learnCard.id.did(),
        contractUri,
        boostUri,
        credential,
        ...(mode ? { mode } : {}),
    });
};

const listed = async (learner: User, actions?: Array<'write' | 'suggest'>) =>
    (
        await learner.clients.fullAuth.contracts.getAllCredentialsForTerms(
            actions ? { actions } : undefined
        )
    ).records.map(record => ({ uri: record.credentialUri, action: record.action }));

const history = async (learner: User, termsUri: string) =>
    (
        await learner.clients.fullAuth.contracts.getTermsTransactionHistory({ uri: termsUri })
    ).records.map(record => record.action);

describe('LC-2423 contract write suggestions', () => {
    afterEach(() => vi.restoreAllMocks());

    it('keeps direct write when neither the contract nor the terms set canWrite', async () => {
        const { owner, learner, contractUri, boostUri } = await setup();
        const uri = await write(owner, learner, contractUri, boostUri);

        expect(await listed(learner)).toEqual([{ uri, action: 'write' }]);
        expect(await listed(learner, ['suggest'])).toEqual([]);
    });

    it.each([
        ['the contract sets canWrite false', { contractCanWrite: false }],
        ['the terms set canWrite false', { contractCanWrite: true, termsCanWrite: false }],
        ['both set canWrite false', { contractCanWrite: false, termsCanWrite: false }],
    ])('lands a suggestion when %s, and tells the holder', async (_name, options) => {
        const queued = vi
            .spyOn(notifications, 'addNotificationToQueue')
            .mockResolvedValue(undefined as never);
        const { owner, learner, contractUri, termsUri, boostUri } = await setup(options);
        const uri = await write(owner, learner, contractUri, boostUri);

        // Clients sync only direct writes, so a suggestion is never auto-accepted.
        expect(await listed(learner)).toEqual([]);
        expect(await listed(learner, ['suggest'])).toEqual([{ uri, action: 'suggest' }]);
        expect(await listed(learner, ['write', 'suggest'])).toEqual([{ uri, action: 'suggest' }]);
        expect(
            (await learner.clients.fullAuth.contracts.getCredentialsForContract({ termsUri }))
                .records
        ).toMatchObject([{ credentialUri: uri, action: 'suggest' }]);
        expect(await history(learner, termsUri)).toContain('suggest');

        const incoming = await learner.clients.fullAuth.credential.incomingCredentials();
        expect(incoming.map(item => item.uri)).toContain(uri);

        const suggested = queued.mock.calls
            .map(([notification]) => notification)
            .filter(notification => notification.type === 'CREDENTIAL_SUGGESTED');
        expect(suggested).toHaveLength(1);
        expect(suggested[0]!.data?.vcUris).toEqual([uri]);
        expect(suggested[0]!.to.profileId).toBe(
            (await learner.clients.fullAuth.profile.getProfile())!.profileId
        );
    });

    it('writes directly only when both the terms and the contract allow it', async () => {
        const { owner, learner, contractUri, boostUri } = await setup({
            contractCanWrite: true,
            termsCanWrite: true,
        });
        const uri = await write(owner, learner, contractUri, boostUri);
        expect(await listed(learner)).toEqual([{ uri, action: 'write' }]);
    });

    it("lands a suggestion when the sender asks with mode: 'suggest'", async () => {
        const { owner, learner, contractUri, boostUri } = await setup({
            contractCanWrite: true,
            termsCanWrite: true,
        });
        const uri = await write(owner, learner, contractUri, boostUri, 'suggest');
        expect(await listed(learner)).toEqual([]);
        expect(await listed(learner, ['suggest'])).toEqual([{ uri, action: 'suggest' }]);
    });

    it('still refuses a category the holder turned off', async () => {
        const { owner, learner, contractUri, termsUri, boostUri } = await setup({
            contractCanWrite: false,
        });
        const terms = termsWith(false);
        terms.write.credentials.categories.Achievement = false;
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms,
        });
        await expect(write(owner, learner, contractUri, boostUri)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await expect(write(owner, learner, contractUri, boostUri, 'suggest')).rejects.toMatchObject(
            { code: 'FORBIDDEN' }
        );
    });

    it('lets the holder accept a suggestion', async () => {
        const { owner, learner, contractUri, boostUri } = await setup({ contractCanWrite: false });
        const uri = await write(owner, learner, contractUri, boostUri);
        await learner.clients.fullAuth.credential.acceptCredential({ uri });

        const received = await learner.clients.fullAuth.credential.receivedCredentials();
        expect(received.map(item => item.uri)).toContain(uri);
        expect(await listed(learner, ['suggest'])).toEqual([]);
    });

    it('lets the holder dismiss a suggestion, idempotently and only their own', async () => {
        const { owner, learner, contractUri, termsUri, boostUri } = await setup({
            contractCanWrite: false,
        });
        const uri = await write(owner, learner, contractUri, boostUri);

        await expect(
            owner.clients.fullAuth.contracts.dismissContractSuggestion({ credentialUri: uri })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        expect(
            await learner.clients.fullAuth.contracts.dismissContractSuggestion({
                credentialUri: uri,
            })
        ).toBe(true);
        expect(
            await learner.clients.fullAuth.contracts.dismissContractSuggestion({
                credentialUri: uri,
            })
        ).toBe(true);

        expect(await listed(learner, ['write', 'suggest'])).toEqual([]);
        expect(
            (await learner.clients.fullAuth.contracts.getCredentialsForContract({ termsUri }))
                .records
        ).toEqual([]);
        const incoming = await learner.clients.fullAuth.credential.incomingCredentials();
        expect(incoming.map(item => item.uri)).not.toContain(uri);
        expect((await history(learner, termsUri)).filter(a => a === 'dismiss')).toHaveLength(1);
    });

    it('refuses to dismiss a direct write', async () => {
        const { owner, learner, contractUri, boostUri } = await setup();
        const uri = await write(owner, learner, contractUri, boostUri);
        await expect(
            learner.clients.fullAuth.contracts.dismissContractSuggestion({ credentialUri: uri })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('turning canWrite on keeps holders on suggestions until they opt in', async () => {
        const { owner, learner, contractUri, termsUri, boostUri } = await setup({
            contractCanWrite: false,
        });
        const preview = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: {
                contract: {
                    write: {
                        credentials: {
                            categories: { Achievement: { required: false, canWrite: true } },
                        },
                    },
                },
            },
        });
        expect(preview.kind).toBe('expanded_optional');

        const saved = (await getContractTermsByUri(termsUri))!;
        expect(saved.terms.terms.write.credentials.canWrite).toEqual({ Achievement: false });
        const first = await write(owner, learner, contractUri, boostUri);
        expect(await listed(learner, ['suggest'])).toEqual([{ uri: first, action: 'suggest' }]);

        const optIn = termsWith(true);
        await learner.clients.fullAuth.contracts.updateConsentedContractTerms({
            uri: termsUri,
            terms: optIn,
        });
        const second = await write(owner, learner, contractUri, boostUri);
        expect(await listed(learner)).toEqual([{ uri: second, action: 'write' }]);
    });

    it('turning canWrite off is relaxed and moves new writes to suggestions', async () => {
        const { owner, learner, contractUri, boostUri } = await setup({ termsCanWrite: true });
        const preview = await owner.clients.fullAuth.contracts.updateConsentFlowContract({
            uri: contractUri,
            changes: {
                contract: {
                    write: {
                        credentials: {
                            categories: { Achievement: { required: false, canWrite: false } },
                        },
                    },
                },
            },
        });
        expect(preview.kind).toBe('relaxed');
        const uri = await write(owner, learner, contractUri, boostUri);
        expect(await listed(learner)).toEqual([]);
        expect(await listed(learner, ['suggest'])).toEqual([{ uri, action: 'suggest' }]);
    });

    it('lands consent auto-boosts in a suggest-only category as suggestions', async () => {
        const suffix = randomBytes(5).toString('hex');
        const owner = await getUser(randomBytes(32).toString('hex'));
        const learner = await getUser(randomBytes(32).toString('hex'));
        await owner.clients.fullAuth.profile.createProfile({ profileId: `auto-owner-${suffix}` });
        await learner.clients.fullAuth.profile.createProfile({ profileId: `auto-user-${suffix}` });
        await owner.clients.fullAuth.profile.registerSigningAuthority({
            endpoint: 'http://localhost:5000/api',
            name: 'mysa',
            did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
        });
        const boostUri = await owner.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            category: 'Achievement',
            name: 'Auto-issued Boost',
        });
        const contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            contract: contractWith(false),
            name: 'Auto Boost Suggestions',
            autoboosts: [
                {
                    boostUri,
                    signingAuthority: { endpoint: 'http://localhost:5000/api', name: 'mysa' },
                },
            ],
        });
        const { termsUri } = await learner.clients.fullAuth.contracts.consentToContract({
            contractUri,
            terms: termsWith(),
        });

        const { records } = await learner.clients.fullAuth.contracts.getCredentialsForContract({
            termsUri,
        });
        expect(records).toHaveLength(1);
        expect(records[0]!.action).toBe('suggest');
        expect(await listed(learner)).toEqual([]);
    });
});
