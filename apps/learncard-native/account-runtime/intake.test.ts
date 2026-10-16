import { expect, test } from 'bun:test';
import { initLearnCard } from '@learncard/init';
import { createIntakeCommands, MAX_CREDENTIAL_BYTES, MAX_DOCUMENT_BYTES } from './intake';
import type { ConsumerWallet } from './consumer-apps';

const raw = (name = 'Community volunteering') => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: { id: 'did:key:sample', name: 'Sample Learning Centre' },
    issuanceDate: '2026-10-16T00:00:00Z',
    name,
    credentialSubject: {
        id: 'did:key:learner',
        achievement: { name, achievementType: 'ext:Project' },
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-10-16T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:key:sample#key',
        proofValue: 'untouched',
    },
});
const input = (
    kind = 'rawVC',
    source = JSON.stringify(raw()),
    name = kind === 'rawVC' ? 'credential.json' : 'learning.txt'
) => ({ kind, name, base64: Buffer.from(source).toString('base64') });
function fixture() {
    let active = true,
        writes = 0,
        uploads = 0,
        issued = 0,
        loseNext = false,
        failTitle = '',
        signature = 'checked';
    const indexed: Record<string, unknown>[] = [],
        payloads = new Map<string, unknown>();
    let source: unknown;
    const lc = {
        id: { did: () => 'did:key:learner' },
        invoke: {
            verifyCredential: async () => {
                if (signature === 'unavailable') throw new Error();
                return { errors: signature === 'failed' ? ['bad proof'] : [] };
            },
            issueCredential: async (value: unknown) => {
                issued++;
                source = value;
                return { ...(value as object), proof: raw().proof };
            },
        },
        store: {
            LearnCloud: {
                uploadEncrypted: async (value: unknown) => {
                    uploads++;
                    if ((value as { name?: string }).name === failTitle) throw new Error('offline');
                    const uri = `private:${uploads}`;
                    payloads.set(uri, value);
                    return uri;
                },
            },
        },
        read: { get: async (uri: string) => payloads.get(uri) },
        index: {
            LearnCloud: {
                getPage: async (query: Record<string, unknown>, options?: { cursor?: string }) => {
                    const values = indexed.filter(item =>
                        Object.entries(query).every(([key, value]) => item[key] === value)
                    );
                    const start = Number(options?.cursor ?? '0'),
                        end = start + 10;
                    return {
                        records: values.slice(start, end),
                        hasMore: end < values.length,
                        cursor: end < values.length ? String(end) : undefined,
                    };
                },
                get: async (query: Record<string, unknown>) =>
                    indexed.filter(item =>
                        Object.entries(query).every(([key, value]) => item[key] === value)
                    ),
                add: async (record: Record<string, unknown>) => {
                    writes++;
                    indexed.push(record);
                    if (loseNext) {
                        loseNext = false;
                        throw new Error('lost response');
                    }
                    return record;
                },
                update: async (id: string, value: Record<string, unknown>) => {
                    writes++;
                    Object.assign(
                        indexed.find(item => item.id === id)!,
                        value
                    );
                },
            },
        },
    } as unknown as ConsumerWallet;
    return {
        lc,
        indexed,
        payloads,
        commands: createIntakeCommands(() => (active ? lc : undefined)),
        restart: () => createIntakeCommands(() => (active ? lc : undefined)),
        stop: () => {
            active = false;
        },
        lose: () => {
            loseNext = true;
        },
        fail: (name: string) => {
            failTitle = name;
        },
        signature: (value: string) => {
            signature = value;
        },
        get writes() {
            return writes;
        },
        get uploads() {
            return uploads;
        },
        get issued() {
            return issued;
        },
        get source() {
            return source;
        },
    };
}
test('review and selection preserve source/proof and do not upload or issue', async () => {
    const f = fixture(),
        source = [raw(), raw('Design portfolio')];
    const review = await f.commands.intakePrepare(
        input(
            'rawVC',
            JSON.stringify({ type: ['VerifiablePresentation'], verifiableCredential: source })
        )
    );
    expect(review.candidates).toHaveLength(2);
    expect(f.writes + f.uploads + f.issued).toBe(0);
    const result = await f.commands.intakeCommit({
        id: review.id,
        selected: [review.candidates[1].id],
    });
    expect(result).toEqual({ added: 1, existing: 0, failed: 0 });
    expect(f.issued).toBe(0);
    expect([...f.payloads.values()]).toEqual([source[1]]);
    expect(f.indexed[0]).toMatchObject({
        category: 'Accomplishment',
        uploadType: 'rawVC',
        fileName: 'credential.json',
    });
});
test('lost index responses reconcile on retry and after a host restart without duplicate records', async () => {
    const f = fixture(),
        review = await f.commands.intakePrepare(input());
    f.lose();
    expect(
        await f.commands.intakeCommit({ id: review.id, selected: [review.candidates[0].id] })
    ).toEqual({ added: 0, existing: 0, failed: 1 });
    expect(
        await f.commands.intakeCommit({ id: review.id, selected: [review.candidates[0].id] })
    ).toEqual({ added: 0, existing: 1, failed: 0 });
    const next = f.restart(),
        rereview = await next.intakePrepare(input());
    expect(
        await next.intakeCommit({ id: rereview.id, selected: [rereview.candidates[0].id] })
    ).toMatchObject({ existing: 1 });
    expect(f.writes).toBe(1);
    expect(f.uploads).toBe(1);
});
test('partial imports report outcomes and retry only unsaved selected credentials', async () => {
    const f = fixture(),
        review = await f.commands.intakePrepare(
            input('rawVC', JSON.stringify([raw(), raw('Second')]))
        );
    f.fail('Second');
    const selected = review.candidates.map(item => item.id);
    expect(await f.commands.intakeCommit({ id: review.id, selected })).toEqual({
        added: 1,
        existing: 0,
        failed: 1,
    });
    f.fail('');
    expect(await f.commands.intakeCommit({ id: review.id, selected })).toEqual({
        added: 1,
        existing: 1,
        failed: 0,
    });
    expect(f.writes).toBe(2);
});
test('failed proofs cannot be selected; unavailable checks remain explicitly unverified', async () => {
    const f = fixture();
    f.signature('failed');
    const review = await f.commands.intakePrepare(input());
    expect(review.candidates[0]).toMatchObject({ signature: 'failed', eligible: false });
    await expect(
        f.commands.intakeCommit({ id: review.id, selected: [review.candidates[0].id] })
    ).rejects.toThrow('intake:changed');
    f.signature('unavailable');
    expect((await f.commands.intakePrepare(input())).candidates[0]).toMatchObject({
        signature: 'unavailable',
        eligible: true,
    });
    expect(f.writes).toBe(0);
});
test('document copies match web source categories and rawArtifact schema and open only owned indexed originals', async () => {
    const f = fixture(),
        review = await f.commands.intakePrepare(input('certificate', 'My course notes'));
    expect(f.uploads + f.issued).toBe(0);
    expect(await f.commands.intakeCommit({ id: review.id, selected: [] })).toMatchObject({
        added: 1,
    });
    expect(f.indexed[0]).toMatchObject({ category: 'certificate', uploadType: 'certificate' });
    expect(f.source).toMatchObject({
        issuer: 'did:key:learner',
        type: ['VerifiableCredential', 'RawArtifactCredential'],
        rawArtifact: {
            type: 'certificate',
            fileName: 'learning.txt',
            fileType: 'TXT',
            data: 'data:text/plain;base64,TXkgY291cnNlIG5vdGVz',
        },
    });
    expect(await f.commands.intakeDocument({ id: f.indexed[0].id })).toEqual({
        name: 'learning.txt',
        base64: Buffer.from('My course notes').toString('base64'),
    });
    await expect(f.commands.intakeDocument({ id: 'other-account' })).rejects.toThrow(
        'intake:changed'
    );
    expect(await f.commands.intakeCommit({ id: review.id, selected: [] })).toMatchObject({
        existing: 1,
    });
    expect(f.writes).toBe(1);
});
test('résumé replacement needs prior reviewed consent and updates the web current record', async () => {
    const f = fixture();
    f.indexed.push({ id: 'web-resume', uri: 'old', category: 'resume' });
    const review = await f.commands.intakePrepare(input('resume', 'New résumé'));
    expect(review.replacesResume).toBe(true);
    await f.commands.intakeCommit({ id: review.id, selected: [] });
    expect(f.indexed).toHaveLength(1);
    expect(f.indexed[0]).toMatchObject({
        id: 'web-resume',
        category: 'resume',
        fileName: 'learning.txt',
    });
    const second = fixture(),
        pending = await second.commands.intakePrepare(input('resume', 'New résumé'));
    second.indexed.push({ id: 'concurrent', category: 'resume' });
    await expect(second.commands.intakeCommit({ id: pending.id, selected: [] })).rejects.toThrow(
        'intake:changed'
    );
    expect(second.writes).toBe(0);
    expect(second.uploads).toBe(0);
});
test('invalid, oversized, mislabeled, unsigned, Family and excessive files never write', async () => {
    const f = fixture();
    for (const value of [
        input('rawVC', 'bad JSON'),
        input('rawVC', JSON.stringify({ arbitrary: true })),
        input('certificate', 'not pdf', 'file.pdf'),
        input('certificate', 'text', '../file.txt'),
        input('rawVC', 'x'.repeat(MAX_CREDENTIAL_BYTES + 1)),
        input('certificate', 'x'.repeat(MAX_DOCUMENT_BYTES + 1)),
        input('rawVC', JSON.stringify({ ...raw(), proof: undefined })),
        input('rawVC', JSON.stringify(Array.from({ length: 51 }, () => raw()))),
    ])
        await expect(f.commands.intakePrepare(value)).rejects.toThrow('intake:');
    expect(f.writes + f.uploads + f.issued).toBe(0);
});
test('duplicate candidates are collapsed, foreign selections refused and new reviews invalidate old ones', async () => {
    const f = fixture(),
        review = await f.commands.intakePrepare(input('rawVC', JSON.stringify([raw(), raw()])));
    expect(review.candidates).toHaveLength(1);
    await expect(f.commands.intakeCommit({ id: review.id, selected: ['foreign'] })).rejects.toThrow(
        'intake:changed'
    );
    await f.commands.intakePrepare(input());
    await expect(
        f.commands.intakeCommit({ id: review.id, selected: [review.candidates[0].id] })
    ).rejects.toThrow('intake:changed');
    f.stop();
    await expect(f.commands.intakeStatus()).rejects.toThrow('intake:signIn');
    expect(f.writes).toBe(0);
});
test('status uses all source index records, including web items, with an honest document display limit', async () => {
    const f = fixture();
    for (let i = 0; i < 26; i++)
        f.indexed.push({ id: String(i), uri: 'web', category: 'certificate' });
    f.indexed.push({ id: 'portfolio', uploadType: 'rawVC', category: 'Accomplishment' });
    expect(await f.commands.intakeStatus()).toMatchObject({
        counts: { certificate: 26, rawVC: 1 },
        limited: true,
    });
    expect((await f.commands.intakeStatus()).documents).toHaveLength(20);
});
test('deep untrusted JSON is rejected before recursive extraction and cancelled reviews cannot be committed', async () => {
    const f = fixture();
    await expect(
        f.commands.intakePrepare(
            input('rawVC', '['.repeat(65) + JSON.stringify(raw()) + ']'.repeat(65))
        )
    ).rejects.toThrow('intake:file');
    const review = await f.commands.intakePrepare(input());
    await f.commands.intakeDiscard({ id: review.id });
    await expect(
        f.commands.intakeCommit({ id: review.id, selected: [review.candidates[0].id] })
    ).rejects.toThrow('intake:changed');
    expect(f.uploads).toBe(0);
});
test('a signed credential container keeps its own proof and does not import nested children in its place', async () => {
    const f = fixture(),
        parent = { ...raw('Parent'), verifiableCredential: [raw('Unrelated child')] };
    const review = await f.commands.intakePrepare(input('rawVC', JSON.stringify(parent)));
    expect(review.candidates.map(item => item.title)).toEqual(['Parent']);
    await f.commands.intakeCommit({ id: review.id, selected: [review.candidates[0].id] });
    expect([...f.payloads.values()]).toEqual([parent]);
});
test('cyclic source pagination fails visibly rather than returning partial counts', async () => {
    const f = fixture();
    f.lc.index.LearnCloud.getPage = async () => ({ records: [], hasMore: true, cursor: 'same' });
    await expect(f.commands.intakeStatus()).rejects.toThrow('Collection page unavailable');
    expect(f.uploads).toBe(0);
});
test('rawArtifact context issues and verifies using the actual SDK without an institutional issuer claim', async () => {
    const signer = await initLearnCard({ seed: 'b'.repeat(64) }),
        f = fixture();
    f.lc.id.did = signer.id.did;
    f.lc.invoke.issueCredential = signer.invoke.issueCredential;
    const review = await f.commands.intakePrepare(input('diploma', 'Synthetic diploma copy'));
    await f.commands.intakeCommit({ id: review.id, selected: [] });
    const signed = [...f.payloads.values()][0];
    expect(
        (await signer.invoke.verifyCredential(signed as never, { checks: ['proof'] })).errors
    ).toHaveLength(0);
    expect(signed).toMatchObject({ issuer: signer.id.did(), rawArtifact: { type: 'diploma' } });
});
