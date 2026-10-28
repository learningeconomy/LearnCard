import { afterAll, describe, expect, mock, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import type { UnsignedVC, VC } from '@learncard/types';

// LearnCard's AiAssessmentContainer finishes an assessment by POSTing the issued summary
// VC with its boost URI (session.boost.uri), which completeAssessment() uses as the
// parent boost. Threads store the summary's contract credential URI, so the owner check
// must resolve boost -> credential through owner-bound records.

const databaseName = `finish_assessment_${randomUUID().replaceAll('-', '')}`;
process.env.MONGO_DB = databaseName;
process.env.REDIS_PREFIX = databaseName;

let issued = 0;
mock.module('../learncard', () => ({
    getLearnCard: async () => ({
        id: { did: () => 'did:example:issuer' },
        invoke: {
            createBoost: async () => `lc:network:test/trpc:boost:summary-${++issued}`,
            createChildBoost: async () => `lc:network:test/trpc:boost:child-${++issued}`,
            issueCredential: async (unsigned: UnsignedVC) => ({
                ...unsigned,
                proof: {
                    type: 'Ed25519Signature2020',
                    created: '2026-01-01T00:00:00.000Z',
                    proofPurpose: 'assertionMethod',
                    verificationMethod: 'did:example:issuer#key-1',
                    proofValue: 'synthetic-test-proof',
                },
            }),
            createDagJwe: async () => ({
                protected: 'p',
                iv: 'i',
                ciphertext: 'c',
                tag: 't',
                recipients: [],
            }),
            writeCredentialToContract: async (
                _did: string,
                _contract: string,
                _jwe: unknown,
                boostUri: string
            ) => boostUri.replace(':boost:', ':credential:'),
        },
    }),
}));

const { db } = await import('../db');
const { createAndPublishBoostCredential } = await import('../learncard/boost-helpers');
const { authorizeFinishAssessment } = await import('./finishAssessment');
const { default: cache } = await import('../utils/cache');

const mongo = new MongoClient(process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27018');
await mongo.connect();

afterAll(async () => {
    await mongo.db(databaseName).dropDatabase();
    await mongo.close();
    await db.close();
    await cache.redis?.quit();
});

const assessmentQA = [{ question: 'What is a common denominator?', answer: 'A shared base.' }];

/** Issue a summary the way sendConversationSummary does and return the stored records. */
const issueSummary = async (did: string, { persistBoost = true } = {}) => {
    const threadId = await db.createThread(did);
    const unsignedVc: UnsignedVC = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'SummaryCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2026-01-01T00:00:00.000Z',
        credentialSubject: { id: did },
    };
    const { boostUri, signedVc, contractCredentialUri } = await createAndPublishBoostCredential({
        unsignedVc,
        did,
        boostOptions: { status: 'LIVE', category: 'ai-summary' },
    });
    await db.storeThreadSummaryCredential(
        did,
        threadId,
        JSON.stringify({ title: 'Fractions' }),
        contractCredentialUri,
        ...(persistBoost ? [boostUri] : [])
    );
    return { boostUri, contractCredentialUri, session: signedVc as VC };
};

// Request body exactly as useFinishAssessmentMutation sends it.
const finishBody = (session: VC, sessionUri: string) =>
    JSON.parse(JSON.stringify({ assessmentQA, session, sessionUri }));

describe('POST /finish-assessment ownership', () => {
    test('accepts a normally issued summary addressed by its boost URI', async () => {
        const did = `did:example:learner-${randomUUID()}`;
        const { boostUri, session } = await issueSummary(did);

        const result = await authorizeFinishAssessment(did, finishBody(session, boostUri));

        expect(result).toEqual({
            ok: true,
            request: { session, sessionUri: boostUri, assessmentQA },
        });
    });

    test('resolves summaries stored before the boost URI was persisted through the issuance ledger', async () => {
        const did = `did:example:learner-${randomUUID()}`;
        const { boostUri, session } = await issueSummary(did, { persistBoost: false });

        const result = await authorizeFinishAssessment(did, finishBody(session, boostUri));

        expect(result.ok).toBe(true);
    });

    test("rejects another learner's summary boost", async () => {
        const owner = `did:example:learner-${randomUUID()}`;
        const intruder = `did:example:learner-${randomUUID()}`;
        const { boostUri, session } = await issueSummary(owner);
        const forged = { ...session, credentialSubject: { id: intruder } };

        expect(await authorizeFinishAssessment(intruder, finishBody(forged, boostUri))).toEqual({
            ok: false,
            status: 404,
            error: 'Not found',
        });
    });

    test('rejects a credential URI, which cannot be the parent boost', async () => {
        const did = `did:example:learner-${randomUUID()}`;
        const { contractCredentialUri, session } = await issueSummary(did);

        expect(
            await authorizeFinishAssessment(did, finishBody(session, contractCredentialUri))
        ).toMatchObject({ ok: false, status: 404 });
    });

    test('requires the session, boost URI, and answers', async () => {
        const did = `did:example:learner-${randomUUID()}`;

        expect(await authorizeFinishAssessment(did, { assessmentQA })).toMatchObject({
            ok: false,
            status: 400,
        });
    });
});
