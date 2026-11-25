import { beforeAll, beforeEach, expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import type { VC } from '@learncard/types';
import type { LearnCardInstance } from '../learncard';
import type { CredentialConsentReceipt } from '../credentials/verification';
import { createSummaryVCStructure } from '../credentials/sessionSummary';
import { projectCredential } from '../credentials/projection';

const lookup = mock();
mock.module('../db', () => ({ db: { getOwnedThreadSummary: lookup } }));
const { verifyAssessmentSummary } = await import('./assessmentSummary');
const createWallet = () =>
    initLearnCard({
        seed: 'ab'.repeat(32),
        didkit: readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')),
    });
let wallet: Awaited<ReturnType<typeof createWallet>>;
let legacy: VC;
let valid: VC;
let did: string;
const boostUri = 'lc:network:synthetic:boost:summary';
const credentialUri = 'lc:network:synthetic:credential:summary';
const data = {
    title: 'Synthetic saved session',
    summary: 'Learned about feedback loops.',
    learned: ['Feedback changes a system.'],
    skills: [{ title: 'Analysis', description: 'Identified feedback loops.' }],
    reflections: [{ title: 'Practice', description: 'Used a model.' }],
    nextSteps: [
        {
            title: 'Apply it',
            description: 'Model a system.',
            keywords: {
                occupations: null,
                careers: null,
                jobs: null,
                skills: ['Analysis'],
                fieldOfStudy: null,
            },
        },
    ],
};
const consent: CredentialConsentReceipt = {
    contractUri: 'test:contract',
    receiptId: 'test:receipt',
    status: 'live',
    updatedAt: '2026-01-01T00:00:00Z',
    contractUpdatedAt: '2026-01-01T00:00:00Z',
    categories: ['ai-summary'],
    credentialUris: [credentialUri],
    personalFields: [],
    purpose: 'model-inference',
    revision: 'synthetic-revision',
    guardian: { required: false, approved: false },
};
beforeAll(async () => {
    wallet = await createWallet();
    did = wallet.id.did();
    const unsigned = createSummaryVCStructure(did, did, structuredClone(data));
    unsigned.boostId = boostUri;
    valid = await wallet.invoke.issueCredential(unsigned);
    // Model the historical missing context; its original proof is deliberately
    // unconfirmed. Recovery must attest trusted history afresh, not bless it.
    legacy = structuredClone(valid);
    legacy['@context'] = (legacy['@context'] as unknown[]).filter(
        context => context !== 'https://ctx.learncard.com/boosts/1.0.1.json'
    ) as VC['@context'];
});
beforeEach(() => lookup.mockReset());
const setup = (credential = structuredClone(legacy)) => {
    const issue = mock(wallet.invoke.issueCredential);
    const read = mock(async () => ({ boostCredential: structuredClone(legacy) }));
    const client = {
        ...wallet,
        read: { ...wallet.read, get: read },
        invoke: { ...wallet.invoke, issueCredential: issue },
    } as unknown as LearnCardInstance;
    lookup.mockResolvedValue({
        credential_uri: credentialUri,
        summary_data: JSON.stringify(data),
        created_at: '2026-04-13T00:00:00Z',
    });
    return {
        input: { did, credential, credentialUri, consent, learnCard: client },
        issue,
        read,
    };
};

test('recovers retained legacy history with a fresh real proof and leaves originals unchanged', async () => {
    const { input, issue } = setup();
    const before = structuredClone(input.credential);
    const originalCheck = await wallet.invoke.verifyCredential(input.credential);
    expect(originalCheck.errors.some(error => error.includes('`BoostCredential`'))).toBe(true);
    const result = await verifyAssessmentSummary(input);
    expect(issue).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith(did, credentialUri);
    expect(result.credential.id).not.toBe(legacy.id);
    expect(result.credential.boostId).toBe(boostUri);
    expect(result.credential.summaryInfo).toEqual(data);
    expect(result.verification.status).toBe('valid');
    expect(result.verification.checks).toContain('proof');
    expect(result.verification.provenance.source).toBe('generated');
    expect(() =>
        projectCredential(result.credential, 'Session Summary', result.verification)
    ).not.toThrow();
    expect(input.credential).toEqual(before);
    const changed = structuredClone(result.credential);
    changed.summaryInfo.summary = 'Changed synthetic claim';
    expect((await wallet.invoke.verifyCredential(changed)).errors.length).toBeGreaterThan(0);
});

test('valid summaries keep their original proof and do not consult recovery history', async () => {
    const { input, issue } = setup(structuredClone(valid));
    const result = await verifyAssessmentSummary(input);
    expect(result.credential).toBe(input.credential);
    expect(lookup).not.toHaveBeenCalled();
    expect(issue).not.toHaveBeenCalled();
});

test('missing owner history cannot authorize reissuance', async () => {
    const { input, issue } = setup();
    lookup.mockResolvedValue(null);
    await expect(verifyAssessmentSummary(input)).rejects.toMatchObject({
        name: 'AssessmentSummaryOwnershipError',
    });
    expect(issue).not.toHaveBeenCalled();
});

test('a caller cannot substitute claims for the saved credential', async () => {
    const { input, issue } = setup();
    input.credential.summaryInfo.summary = 'Caller replacement';
    await expect(verifyAssessmentSummary(input)).rejects.toMatchObject({
        name: 'AssessmentSummaryOwnershipError',
    });
    expect(issue).not.toHaveBeenCalled();
});

test('mismatched retained history is not signed', async () => {
    const { input, issue } = setup();
    lookup.mockResolvedValue({
        summary_data: JSON.stringify({ ...data, summary: 'Different history' }),
    });
    await expect(verifyAssessmentSummary(input)).rejects.toThrow();
    expect(issue).not.toHaveBeenCalled();
});

test('recovery does not drop fields that the current summary schema cannot represent', async () => {
    const { input, issue, read } = setup();
    const extended = { ...data, additionalClaim: 'Retained synthetic claim' };
    input.credential.summaryInfo = extended;
    read.mockResolvedValueOnce({
        boostCredential: structuredClone(input.credential),
    });
    lookup.mockResolvedValue({ summary_data: JSON.stringify(extended) });
    await expect(verifyAssessmentSummary(input)).rejects.toThrow();
    expect(issue).not.toHaveBeenCalled();
});

test('an invalid proof on a correctly defined summary is not treated as legacy recovery', async () => {
    const altered = structuredClone(valid);
    altered.summaryInfo.summary = 'Changed synthetic claim';
    const { input, issue } = setup(altered);
    await expect(verifyAssessmentSummary(input)).rejects.toThrow();
    expect(lookup).not.toHaveBeenCalled();
    expect(issue).not.toHaveBeenCalled();
});

test("another issuer's legacy summary is not reissued by this service", async () => {
    const { input, issue, read } = setup();
    input.credential.issuer = 'did:example:other-issuer';
    read.mockResolvedValueOnce({
        boostCredential: structuredClone(input.credential),
    });
    await expect(verifyAssessmentSummary(input)).rejects.toThrow();
    expect(issue).not.toHaveBeenCalled();
});

test("completion binds the boost URI to the owner's actual saved credential", async () => {
    const { input, issue } = setup();
    await expect(
        verifyAssessmentSummary({
            ...input,
            expectedBoostUri: 'lc:network:synthetic:boost:other',
        })
    ).rejects.toMatchObject({ name: 'AssessmentSummaryOwnershipError' });
    expect(issue).not.toHaveBeenCalled();
});

test('completion accepts matching credential and boost URIs after recovery', async () => {
    const { input } = setup();
    expect(
        (await verifyAssessmentSummary({ ...input, expectedBoostUri: boostUri })).verification
            .status
    ).toBe('valid');
});

test('a newly issued credential must also pass proof verification', async () => {
    const { input, issue } = setup();
    issue.mockImplementationOnce(async unsigned => ({ ...unsigned }) as VC);
    await expect(verifyAssessmentSummary(input)).rejects.toThrow();
});
