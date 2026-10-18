import { expect, test } from 'bun:test';
import { createLearnerCommands, goalsIndexID, skillsFromCredential } from './learner';
import { initLearnCard } from '@learncard/init';
import { readFile } from 'node:fs/promises';
import type { UnsignedVC, VC } from '@learncard/types';

const alignment = (id = 'one') => ({
    targetUrl: `https://example.org/frameworks/core/skills/${id}`,
    targetName: 'Communication',
    targetFramework: 'Core skills',
});
const credential = (alignments = [alignment()]) => ({
    type: ['VerifiableCredential'],
    issuer: { id: 'did:example:school', name: 'Sample school' },
    credentialSubject: { achievement: { name: 'Project', alignment: alignments } },
});
const fixture = (payload?: Record<string, unknown>) => {
    let row: Record<string, unknown> | undefined = payload
        ? {
              id: goalsIndexID,
              uri: 'original',
              category: 'Goals',
              verifiableData: payload,
              customMetadata: 'preserve',
          }
        : undefined;
    let issued: UnsignedVC | undefined;
    let uploads = 0,
        writes = 0;
    let beforeWrite = async () => {},
        afterWrite = async () => {};
    let readFailure = false;
    const wallet = {
        id: { did: () => 'did:example:learner' },
        index: {
            LearnCloud: {
                get: async () => {
                    if (readFailure) throw Error('offline');
                    return row ? [row] : [];
                },
                getPage: async () => ({ records: [], hasMore: false }),
                add: async (next: Record<string, unknown>) => {
                    await beforeWrite();
                    row = next;
                    writes++;
                    await afterWrite();
                },
                update: async (_id: string, next: Record<string, unknown>) => {
                    await beforeWrite();
                    row = { ...row, ...next };
                    writes++;
                    await afterWrite();
                },
            },
        },
        read: {
            get: async () => {
                throw Error('unavailable');
            },
        },
        invoke: {
            issueCredential: async (raw: UnsignedVC): Promise<UnsignedVC | VC> => {
                issued = raw;
                return raw;
            },
        },
        store: {
            LearnCloud: {
                uploadEncrypted: async () => {
                    uploads++;
                    return `encrypted-${uploads}`;
                },
            },
        },
    };
    let active: typeof wallet | undefined = wallet;
    const commands = createLearnerCommands(
        () => active as never,
        async record => record
    );
    return {
        wallet,
        commands,
        get row() {
            return row;
        },
        set row(value) {
            row = value;
        },
        get issued() {
            return issued;
        },
        get uploads() {
            return uploads;
        },
        get writes() {
            return writes;
        },
        offline: () => {
            readFailure = true;
        },
        reconnect: () => {
            readFailure = false;
        },
        lock: () => {
            active = undefined;
        },
        beforeWrite: (fn: () => Promise<void>) => {
            beforeWrite = fn;
        },
        afterWrite: (fn: () => Promise<void>) => {
            afterWrite = fn;
        },
    };
};

test('skill projection supports standard and certified wrappers, distinct targets and unique sources', () => {
    const raw = credential([alignment(), alignment(), alignment('two')]);
    const record = { id: 'record', category: 'Achievement', title: 'Team project' };
    const legacy = { ...record, category: 'Skill', title: 'Self-Assigned Skills' };
    expect(skillsFromCredential(legacy, raw, 'did:example:school')[0].sources[0].selfReported).toBe(
        true
    );
    expect(skillsFromCredential(legacy, raw, 'did:example:other')[0].sources[0].selfReported).toBe(
        false
    );
    expect(skillsFromCredential(record, raw)).toHaveLength(2);
    expect(skillsFromCredential(record, { boostCredential: raw })).toEqual(
        skillsFromCredential(record, raw)
    );
    expect(
        skillsFromCredential({ ...record, category: 'Self-Assigned Skills' }, raw)[0].sources[0]
            .selfReported
    ).toBe(true);
    expect(skillsFromCredential(record, raw)[0].sources).toEqual([
        { id: 'record', title: 'Team project', issuer: 'Sample school', selfReported: false },
    ]);
    expect(
        skillsFromCredential(
            record,
            credential([{ ...alignment(), targetUrl: 'javascript:alert(1)' }])
        )
    ).toEqual([]);
});

test('paged skills skip private plumbing and document originals and retain partial failure', async () => {
    const f = fixture();
    let reads = 0;
    f.wallet.index.LearnCloud.getPage = async () =>
        ({
            records: [
                { id: 'good', uri: 'good', category: 'Achievement' },
                { id: 'bad', uri: 'bad', category: 'Skill' },
                { id: '__verifiable_data_skills__', uri: 'private', category: 'Skill' },
                { id: 'document', uri: 'document', category: 'resume' },
            ],
            hasMore: true,
            cursor: 'page2',
        }) as never;
    f.wallet.read.get = async (uri?: string) => {
        reads++;
        if (uri !== 'good') throw Error();
        return credential() as never;
    };
    const page = await f.commands.skillsPage({});
    expect(reads).toBe(2);
    expect(page.skills).toHaveLength(1);
    expect(page.unavailable).toBe(1);
    expect(page.hasMore).toBe(true);
    await expect(f.commands.skillsPage({ cursor: 'page2' })).rejects.toThrow();
});

test('failed or malformed goals reads cannot establish an empty editable profile', async () => {
    const f = fixture({ goals: 'invalid' });
    await expect(f.commands.goalsRead()).rejects.toThrow('learner:unavailable');
    f.row = { id: goalsIndexID, uri: 'original' };
    await expect(f.commands.goalsRead()).rejects.toThrow();
    expect(f.issued).toBeUndefined();
    expect(f.writes).toBe(0);
});

test('goals round trip uses web VC v2/index wire shape and preserves unknown data and long existing goals', async () => {
    const legacy = 'An existing long goal that must not be silently truncated by native';
    const f = fixture({ goals: [legacy], future: { choice: 'keep' } });
    const before = await f.commands.goalsRead();
    const saved = await f.commands.goalsSave({
        revision: before.revision,
        goals: [legacy, 'Learn something new'],
    });
    expect(saved.goals).toEqual([legacy, 'Learn something new']);
    expect(f.issued!.type).toEqual(['VerifiableCredential', 'VerifiableData']);
    expect(f.issued!['@context'][0]).toBe('https://www.w3.org/ns/credentials/v2');
    expect(f.issued!.credentialSubject).toEqual({
        id: 'did:example:learner',
        dataKey: 'skill-profile-goals',
        dataPayload: { goals: saved.goals, future: { choice: 'keep' } },
    });
    expect(f.row).toMatchObject({
        id: goalsIndexID,
        category: 'Goals',
        uri: 'encrypted-1',
        customMetadata: 'preserve',
        sharedUris: {},
        verifiableData: (f.issued!.credentialSubject as Record<string, unknown>).dataPayload,
    });
    expect(await f.commands.goalsRead()).toEqual(saved);
    await f.commands.goalsSave({ revision: before.revision, goals: saved.goals });
    expect(f.uploads).toBe(1);
    expect(f.writes).toBe(1);
});

test('fallback reads the native JSON subject payload and preserves it through a save', async () => {
    const f = fixture();
    f.row = { id: goalsIndexID, uri: 'old' };
    f.wallet.read.get = async () =>
        ({
            credentialSubject: [
                {
                    dataKey: 'skill-profile-goals',
                    dataPayload: { goals: ['Explore'], future: true },
                },
            ],
        }) as never;
    const value = await f.commands.goalsRead();
    await f.commands.goalsSave({ revision: value.revision, goals: ['Explore', 'Study design'] });
    expect(f.row?.verifiableData).toEqual({ goals: ['Explore', 'Study design'], future: true });
});

test('new goal validation rejects overlong Unicode and controls without truncation or issuing', async () => {
    const f = fixture();
    const value = await f.commands.goalsRead();
    for (const goal of ['🌟'.repeat(18), 'two\nlines', ' trailing ', ''])
        await expect(
            f.commands.goalsSave({ revision: value.revision, goals: [goal] })
        ).rejects.toThrow('learner:invalid');
    expect(f.issued).toBeUndefined();
    await f.commands.goalsSave({ revision: value.revision, goals: ['تعلّم مهارة جديدة'] });
    expect(f.writes).toBe(1);
});

test('no-change save makes no issuance, upload or index mutation', async () => {
    const f = fixture({ goals: ['Explore'] });
    const value = await f.commands.goalsRead();
    expect(await f.commands.goalsSave(value)).toEqual(value);
    expect(f.issued).toBeUndefined();
    expect(f.uploads).toBe(0);
    expect(f.writes).toBe(0);
});

test('another client change before commit is retained rather than overwritten', async () => {
    const f = fixture({ goals: ['First'] });
    const value = await f.commands.goalsRead();
    f.wallet.store.LearnCloud.uploadEncrypted = async () => {
        f.row = { ...f.row, uri: 'web-changed', verifiableData: { goals: ['From web'] } };
        return 'new';
    };
    await expect(
        f.commands.goalsSave({ revision: value.revision, goals: ['Native draft'] })
    ).rejects.toThrow('learner:changed');
    expect(f.row?.uri).toBe('web-changed');
    expect(f.writes).toBe(0);
});

test('lost committed write reply reconciles and a retry never issues again', async () => {
    const f = fixture({ goals: ['First'] });
    const value = await f.commands.goalsRead();
    f.afterWrite(async () => {
        f.offline();
        throw Error('lost response');
    });
    await expect(
        f.commands.goalsSave({ revision: value.revision, goals: ['New goal'] })
    ).rejects.toThrow('learner:uncertain');
    f.reconnect();
    const confirmed = await f.commands.goalsSave({ revision: value.revision, goals: ['New goal'] });
    expect(confirmed.goals).toEqual(['New goal']);
    expect(f.uploads).toBe(1);
    expect(f.writes).toBe(1);
});

test('failed index mutation preserves the old record and reports an uncertain outcome', async () => {
    const f = fixture({ goals: ['Keep'] });
    const before = await f.commands.goalsRead();
    f.beforeWrite(async () => {
        throw Error('not committed');
    });
    await expect(
        f.commands.goalsSave({ revision: before.revision, goals: ['Try'] })
    ).rejects.toThrow('learner:uncertain');
    expect(f.row?.uri).toBe('original');
    expect(f.row?.verifiableData).toEqual({ goals: ['Keep'] });
});

test('locking during issuance prevents subsequent upload and index writes', async () => {
    const f = fixture();
    const before = await f.commands.goalsRead();
    f.wallet.invoke.issueCredential = async () => {
        f.lock();
        return {} as never;
    };
    await expect(
        f.commands.goalsSave({ revision: before.revision, goals: ['Explore'] })
    ).rejects.toThrow('learner:signIn');
    expect(f.uploads).toBe(0);
    expect(f.writes).toBe(0);
    await expect(f.commands.skillsSource({ id: 'other' })).rejects.toThrow('learner:signIn');
});

test('goal payload signs and verifies through the real DIDKit SDK with native JSON intact', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const lc = await initLearnCard({ seed: 'c'.repeat(64), didkit: wasm });
    const f = fixture({ goals: [], future: { nested: [true, 'keep'] } });
    f.wallet.id.did = () => lc.id.did();
    let signed: VC | undefined;
    f.wallet.invoke.issueCredential = async raw => {
        signed = await lc.invoke.issueCredential(raw);
        return signed;
    };
    const before = await f.commands.goalsRead();
    await f.commands.goalsSave({ revision: before.revision, goals: ['Learn together'] });
    expect((signed!.credentialSubject as Record<string, unknown>).dataPayload).toEqual({
        goals: ['Learn together'],
        future: { nested: [true, 'keep'] },
    });
    expect((await lc.invoke.verifyCredential(signed!, { checks: ['proof'] })).errors).toEqual([]);
});
