import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import { createClaimCommands, categoryForClaim, claimErrorCode, claimPreviewURL } from './claims';
import type { ConsumerWallet } from './consumer-apps';

const boostURI = 'lc:network:staging.network.learncard.com/trpc:boost:synthetic-template';
const credentialURI = 'lc:network:staging.network.learncard.com/trpc:credential:synthetic-issued';
const link = { boostURI, challenge: 'synthetic-capability' };
const request = { ...link, requestID: 'b9a6f381-66b0-4a46-a05a-d967e5a06136' };
const raw = () => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'BoostCredential'],
    issuer: 'did:key:sample',
    name: 'Public sample',
    boostId: boostURI,
    credentialSubject: { achievement: { name: 'Project', achievementType: 'ext:Project' } },
    proof: { proofValue: 'untouched' },
});
function fixture() {
    let payload: Record<string, unknown> = raw(),
        issues = 0,
        writes = 0,
        verificationErrors: string[] = [],
        active = true;
    let status: unknown = { status: 'absent' };
    const calls: string[][] = [];
    let received = [
        { uri: credentialURI, received: new Date().toISOString(), sent: new Date().toISOString() },
    ];
    let indexed: unknown[] = [];
    const lc = {
        invoke: {
            claimBoostWithLink: async (...args: string[]) => {
                calls.push(args);
                issues++;
                return credentialURI;
            },
            getClaimBoostWithLinkStatus: async (...args: string[]) => {
                calls.push(args);
                return status;
            },
            getMyCredentialLifecycleStatuses: async () => ({ [credentialURI]: 'active' }),
            getReceivedCredentials: async () => received,
            verifyCredential: async () => ({ errors: verificationErrors }),
        },
        read: { get: async () => payload },
        index: {
            LearnCloud: {
                get: async () => indexed,
                add: async (value: unknown) => {
                    writes++;
                    indexed = [value];
                    return true;
                },
            },
        },
    } as unknown as ConsumerWallet;
    const commands = createClaimCommands(
        () => (active ? lc : undefined),
        async (record, verify, source) => ({ ...record, verify, source }),
        async () => payload
    );
    return {
        commands,
        lc,
        calls,
        setStatus: (value: unknown) => {
            status = value;
        },
        get issues() {
            return issues;
        },
        get writes() {
            return writes;
        },
        get indexed() {
            return indexed;
        },
        setRaw: (value: Record<string, unknown>) => {
            payload = value;
        },
        invalid: () => {
            verificationErrors = ['tampered'];
        },
        missingReceipt: () => {
            received = [];
        },
        stop: () => {
            active = false;
        },
    };
}
test('preview reads without issuance/index writes and preserves Portfolio and signed source', async () => {
    const f = fixture(),
        preview = await f.commands.claimsPreview(link);
    expect(preview).toMatchObject({
        category: 'Accomplishment',
        verify: false,
        source: { proof: { proofValue: 'untouched' } },
    });
    expect(f.issues).toBe(0);
    expect(f.writes).toBe(0);
});
test('issuance requires the current reviewed template and consumes that review once', async () => {
    const f = fixture();
    await expect(f.commands.claimsIssue(request)).rejects.toThrow('claims:changed');
    await f.commands.claimsPreview(link);
    await f.commands.claimsIssue(request);
    await expect(f.commands.claimsIssue(request)).rejects.toThrow('claims:changed');
    expect(f.issues).toBe(1);
    const changed = fixture();
    await changed.commands.claimsPreview(link);
    changed.setRaw({ ...raw(), name: 'Changed' });
    await expect(changed.commands.claimsIssue(request)).rejects.toThrow('claims:changed');
    expect(changed.issues).toBe(0);
});
test('request status forwards the exact receipt and accepts only its issued credential', async () => {
    const f = fixture();
    f.missingReceipt(); // The recent receipt list can omit this claim.
    f.setStatus({ status: 'pending' });
    expect(await f.commands.claimsStatus(request)).toEqual({ status: 'pending' });
    await expect(f.commands.claimsFinish({ uri: credentialURI, request })).rejects.toThrow(
        'claims:pending'
    );
    f.setStatus({ status: 'complete', credentialUri: credentialURI });
    await expect(
        f.commands.claimsFinish({ uri: credentialURI + '-other', request })
    ).rejects.toThrow('claims:pending');
    await f.commands.claimsFinish({ uri: credentialURI, request });
    expect(f.calls).toEqual(
        Array.from({ length: 4 }, () => [boostURI, link.challenge, request.requestID])
    );
    expect(f.issues).toBe(0);
    expect(f.writes).toBe(1);
    f.setStatus({ status: 'complete', credentialUri: 'https://foreign.example/credential' });
    await expect(f.commands.claimsStatus(request)).rejects.toThrow();
});
test('saving a known receipt verifies owned content and indexes idempotently with its category', async () => {
    const f = fixture();
    const before = JSON.stringify(raw());
    await f.commands.claimsFinish({ uri: credentialURI });
    await f.commands.claimsFinish({ uri: credentialURI });
    expect(f.issues).toBe(0);
    expect(f.writes).toBe(1);
    expect(f.indexed[0]).toMatchObject({ uri: credentialURI, category: 'Accomplishment' });
    expect(JSON.stringify(raw())).toBe(before);
});
test('unconfirmed receipts and invalid signatures never enter the personal index', async () => {
    const missing = fixture();
    missing.missingReceipt();
    await expect(missing.commands.claimsFinish({ uri: credentialURI })).rejects.toThrow(
        'claims:pending'
    );
    expect(missing.writes).toBe(0);
    const invalid = fixture();
    invalid.invalid();
    await expect(invalid.commands.claimsFinish({ uri: credentialURI })).rejects.toThrow(
        'claims:signature'
    );
    expect(invalid.writes).toBe(0);
});
test('family templates, foreign environments and malformed capabilities cannot issue', async () => {
    const f = fixture();
    f.setRaw({ ...raw(), display: { displayType: 'family' } });
    await expect(f.commands.claimsPreview(link)).rejects.toThrow('claims:family');
    for (const value of [
        { ...request, boostURI: boostURI.replace('staging.network', 'network') },
        { ...request, challenge: '' },
        { ...request, challenge: 'bad\nvalue' },
        { ...request, extra: true },
    ])
        await expect(f.commands.claimsIssue(value)).rejects.toThrow();
    expect(f.issues).toBe(0);
    f.stop();
    await expect(f.commands.claimsFinish({ uri: credentialURI })).rejects.toThrow('claims:signIn');
    expect(claimErrorCode(new Error('private capability must not escape'))).toBe(
        'claims:connection'
    );
});
test('ambiguous-result reconciliation is read-only and matches exact template identity', async () => {
    const f = fixture();
    expect(
        await f.commands.claimsReconcile({
            boostURI,
            since: new Date(Date.now() - 60_000).toISOString(),
        })
    ).toEqual({ uri: credentialURI });
    f.setRaw({ ...raw(), boostId: 'another-template' });
    expect(
        await f.commands.claimsReconcile({ boostURI, since: new Date(0).toISOString() })
    ).toBeNull();
    expect(f.issues).toBe(0);
    expect(f.writes).toBe(0);
});
test('issuer tags and Qualifications are preserved when claiming instead of hardcoded Achievements', () => {
    for (const achievementType of ['ext:Homework', 'ext:Presentation', 'ext:Project'])
        expect(
            categoryForClaim({ ...raw(), credentialSubject: { achievement: { achievementType } } })
        ).toBe('Accomplishment');
    expect(
        categoryForClaim({
            ...raw(),
            credentialSubject: { achievement: { achievementType: 'ext:ExamAdjustments' } },
        })
    ).toBe('Accommodation');
    expect(
        categoryForClaim({
            ...raw(),
            credentialSubject: { achievement: { achievementType: 'License' } },
        })
    ).toBe('Qualifications');
    expect(
        categoryForClaim({
            ...raw(),
            credentialSubject: {
                achievement: { achievementType: 'Badge', tag: ['lc:category:Accommodation'] },
            },
        })
    ).toBe('Accommodation');
});
test('claim saving checks a real SDK signature and rejects the same credential after tampering', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const issuer = await initLearnCard({ seed: 'a'.repeat(64), didkit: wasm });
    const holder = await initLearnCard({ seed: 'b'.repeat(64), didkit: wasm });
    const signed = await issuer.invoke.issueCredential({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: issuer.id.did(),
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: holder.id.did() },
    });
    let payload = signed,
        writes = 0;
    const lc = {
        invoke: {
            getReceivedCredentials: async () => [
                { uri: credentialURI, received: new Date().toISOString() },
            ],
            verifyCredential: holder.invoke.verifyCredential,
        },
        read: { get: async () => payload },
        index: {
            LearnCloud: {
                get: async () => [],
                add: async () => {
                    writes++;
                    return true;
                },
            },
        },
    } as unknown as ConsumerWallet;
    const commands = createClaimCommands(
        () => lc,
        async () => ({}),
        async () => signed
    );
    await commands.claimsFinish({ uri: credentialURI });
    expect(writes).toBe(1);
    payload = { ...signed, credentialSubject: { id: issuer.id.did() } };
    await expect(commands.claimsFinish({ uri: credentialURI })).rejects.toThrow('claims:signature');
    expect(writes).toBe(1);
}, 30_000);

test('preview uses the deployed OpenAPI base and keeps capability characters in one query value', () => {
    const url = claimPreviewURL(boostURI, 'token+with=&characters');
    expect(url.origin).toBe('https://staging.network.learncard.com');
    expect(url.pathname).toBe('/api/storage/resolve');
    expect(url.searchParams.get('challenge')).toBe('token+with=&characters');
    expect(url.searchParams.get('uri')).toBe(boostURI);
    expect(() => claimPreviewURL('https://foreign.example/template', 'token')).toThrow();
    expect(categoryForClaim({ type: ['VerifiableCredential', 'toString'] })).toBe('Achievement');
});
