import { expect, test } from 'bun:test';
import { ConsentFlowContractDetailsValidator, ConsentFlowTermsValidator } from '@learncard/types';
import { createConsumerCommands, type ConsumerWallet } from './consumer-apps';
import { createSampleCredentialCommands } from './sample-credentials';

function fixture() {
    const uri = 'lc:sample',
        id = 'native-sample-student';
    const contract = ConsentFlowContractDetailsValidator.parse({
        uri,
        name: 'Sample student',
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
        owner: { did: 'did:example:school', profileId: 'school' },
        autoBoosts: ['boost-1', 'boost-2'],
        contract: {
            read: { credentials: { categories: {} }, personal: {} },
            write: {
                credentials: {
                    categories: { Achievement: { required: false, defaultEnabled: true } },
                },
                personal: {},
            },
        },
    });
    const state = {
        connected: false,
        issued: 2,
        failedIndex: '',
        invalidProof: false,
        wrongContract: false,
        publications: 0,
        accepts: 0,
        writes: 0,
    };
    let terms = ConsentFlowTermsValidator.parse({
        read: { anonymize: false, credentials: { shareAll: false, categories: {} }, personal: {} },
        write: { credentials: { categories: { Achievement: true } }, personal: {} },
    });
    const indexed = new Set<string>();
    const wallet = {
        invoke: {
            getContract: async () => structuredClone(contract),
            getConsentedContracts: async () => ({
                records: state.connected ? [{ uri: 'terms', contract, terms, status: 'live' }] : [],
                hasMore: false,
            }),
            consentToContract: async (_uri: string, input: { terms: typeof terms }) => {
                state.publications++;
                state.connected = true;
                terms = input.terms;
                return 'terms';
            },
            getCredentialsForContract: async (_uri: string, options: { cursor?: string }) => {
                const n = options.cursor ? 2 : 1;
                return {
                    records:
                        n <= state.issued
                            ? [
                                  {
                                      credentialUri: `cred-${n}`,
                                      boostUri: `boost-${n}`,
                                      termsUri: 'terms',
                                      contractUri: state.wrongContract ? 'other' : uri,
                                  },
                              ]
                            : [],
                    hasMore: n < state.issued,
                    cursor: n < state.issued ? 'next' : undefined,
                };
            },
            verifyCredential: async () => ({ errors: state.invalidProof ? ['invalid'] : [] }),
            acceptCredential: async () => {
                state.accepts++;
                return true;
            },
        },
        read: {
            get: async (uri: string) => ({
                '@context': ['https://www.w3.org/2018/credentials/v1'],
                type: ['VerifiableCredential'],
                issuer: 'did:example:school',
                issuanceDate: '2026-10-01T00:00:00Z',
                name: uri,
                credentialSubject: { id: 'did:example:student' },
                proof: {
                    type: 'Ed25519Signature2020',
                    created: '2026-10-01T00:00:00Z',
                    proofPurpose: 'assertionMethod',
                    verificationMethod: 'did:example:school#key',
                    proofValue: 'synthetic',
                },
            }),
        },
        index: {
            LearnCloud: {
                get: async ({ uri }: { uri: string }) =>
                    indexed.has(uri) ? [{ id: uri, uri }] : [],
                add: async ({ uri, contractUri }: { uri: string; contractUri: string }) => {
                    if (state.failedIndex === uri) throw new Error('lost write');
                    expect(contractUri).toBe('lc:sample');
                    indexed.add(uri);
                    state.writes++;
                },
            },
        },
    } as unknown as ConsumerWallet;
    let active: ConsumerWallet | undefined = wallet;
    const source = { [id]: uri };
    return {
        state,
        contract,
        indexed,
        wallet,
        id,
        clear: () => {
            active = undefined;
        },
        samples: createSampleCredentialCommands(() => active, source),
        consumer: createConsumerCommands(() => active, source),
    };
}

test('sample preview is read-only; configured contract review requires explicit consent and does not install an app', async () => {
    const f = fixture();
    const status = await f.samples.samplesStatus();
    expect(status[0].connected).toBe(false);
    expect(status[0].expected).toBe(2);
    const review = await f.consumer.appsReview({ id: f.id });
    expect(review?.writeCredentials[0].required).toBe(false);
    expect(review?.writeCredentials[0].defaultEnabled).toBe(true);
    expect(f.state.publications).toBe(0);
    await expect(f.samples.samplesSync({ id: f.id })).rejects.toThrow('consumer:decision');
    const decision = {
        listingID: f.id,
        reviewID: review!.id,
        readCategories: [],
        selectedCredentials: {},
        personalValues: {},
        writeCategories: ['Achievement'],
        writePersonal: [],
        anonymize: false,
    };
    await expect(f.consumer.appsConsent({ ...decision, writeCategories: [] })).rejects.toThrow(
        'consumer:decision'
    );
    await f.consumer.appsConsent(decision);
    expect(f.state.publications).toBe(1);
    const next = await f.consumer.appsReview({ id: f.id });
    await f.consumer.appsConsent({ ...decision, reviewID: next!.id });
    expect(f.state.publications).toBe(1);
    expect(await f.samples.samplesSync({ id: f.id })).toEqual({ added: 2, existing: 0, failed: 0 });
    expect(await f.samples.samplesSync({ id: f.id })).toEqual({ added: 0, existing: 2, failed: 0 });
    expect(f.state.writes).toBe(2);
});
test('partial delivery and index failure remain retryable without duplicate records', async () => {
    const f = fixture();
    f.state.connected = true;
    f.state.issued = 1;
    expect(await f.samples.samplesSync({ id: f.id })).toEqual({ added: 1, existing: 0, failed: 1 });
    f.state.issued = 2;
    f.state.failedIndex = 'cred-2';
    expect((await f.samples.samplesSync({ id: f.id })).failed).toBe(1);
    f.state.failedIndex = '';
    expect(await f.samples.samplesSync({ id: f.id })).toEqual({ added: 1, existing: 1, failed: 0 });
    expect(f.indexed.size).toBe(2);
});
test('wrong contract, failed signature, expiry and unconfigured bundle cannot add data', async () => {
    const f = fixture();
    f.state.connected = true;
    await expect(f.samples.samplesSync({ id: 'unconfigured' })).rejects.toThrow(
        'consumer:unavailable'
    );
    f.state.wrongContract = true;
    await expect(f.samples.samplesSync({ id: f.id })).rejects.toThrow('consumer:changed');
    f.state.wrongContract = false;
    f.state.invalidProof = true;
    await expect(f.samples.samplesSync({ id: f.id })).rejects.toThrow('consumer:changed');
    f.contract.expiresAt = '2020-01-01T00:00:00Z';
    await expect(f.samples.samplesSync({ id: f.id })).rejects.toThrow('consumer:inactive');
    expect(f.state.accepts).toBe(0);
    expect(f.state.writes).toBe(0);
});
test('changed auto-boost list and account replacement invalidate consent reviews', async () => {
    const f = fixture();
    const review = await f.consumer.appsReview({ id: f.id });
    const decision = {
        listingID: f.id,
        reviewID: review!.id,
        readCategories: [],
        selectedCredentials: {},
        personalValues: {},
        writeCategories: ['Achievement'],
        writePersonal: [],
        anonymize: false,
    };
    f.contract.autoBoosts!.push('boost-3');
    await expect(f.consumer.appsConsent(decision)).rejects.toThrow('consumer:changed');
    f.clear();
    await expect(f.consumer.appsConsent(decision)).rejects.toThrow('consumer:signIn');
    expect(f.state.publications).toBe(0);
});

test('a committed consent with a lost reply is reconciled before retrying publication', async () => {
    const f = fixture();
    const publish = f.wallet.invoke.consentToContract;
    f.wallet.invoke.consentToContract = async (...args) => {
        await publish(...args);
        throw new Error('reply lost');
    };
    const review = await f.consumer.appsReview({ id: f.id });
    const decision = {
        listingID: f.id,
        reviewID: review!.id,
        readCategories: [],
        selectedCredentials: {},
        personalValues: {},
        writeCategories: ['Achievement'],
        writePersonal: [],
        anonymize: false,
    };
    await expect(f.consumer.appsConsent(decision)).rejects.toThrow('reply lost');
    await f.consumer.appsConsent(decision);
    expect(f.state.publications).toBe(1);
});
test('account changes during reads and repeated cursors stop before any acceptance', async () => {
    const f = fixture();
    f.state.connected = true;
    const read = f.wallet.invoke.getConsentedContracts;
    f.wallet.invoke.getConsentedContracts = async (...args) => {
        const result = await read(...args);
        f.clear();
        return result;
    };
    await expect(f.samples.samplesSync({ id: f.id })).rejects.toThrow('consumer:signIn');
    expect(f.state.accepts).toBe(0);
    const g = fixture();
    g.state.connected = true;
    g.wallet.invoke.getCredentialsForContract = async () => ({
        records: [],
        hasMore: true,
        cursor: 'same',
    });
    await expect(g.samples.samplesSync({ id: g.id })).rejects.toThrow('consumer:connection');
    expect(g.state.accepts).toBe(0);
});
test('an index write whose reply is lost is recovered by URI without duplicating the record', async () => {
    const f = fixture();
    f.state.connected = true;
    const add = f.wallet.index.LearnCloud.add;
    let lost = false;
    f.wallet.index.LearnCloud.add = async (...args) => {
        const result = await add(...args);
        if (!lost) {
            lost = true;
            throw new Error('index reply lost');
        }
        return result;
    };
    expect((await f.samples.samplesSync({ id: f.id })).failed).toBe(1);
    expect(await f.samples.samplesSync({ id: f.id })).toEqual({ added: 0, existing: 2, failed: 0 });
    expect(f.state.writes).toBe(2);
});
