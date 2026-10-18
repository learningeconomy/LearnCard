import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { initLearnCard } from '@learncard/init';
import { checkCredentialStatus, type CredentialStatusReader } from './credential-status';

const entry = {
    type: 'BitstringStatusListEntry',
    statusPurpose: 'revocation',
    statusListCredential: 'https://staging.network.learncard.com/status/test',
    statusListIndex: '7',
};
const raw = { credentialStatus: entry };
const outcome = (isSet: boolean) => ({ ...entry, entryType: entry.type, isSet });
const reader = (result: unknown, statuses: unknown = {}): CredentialStatusReader => ({
    getStatuses: async () => statuses,
    verify: async (_, checks) => (checks[0] === 'proof' ? { errors: [] } : result),
});

test.each(['active', 'revoked', 'suspended'] as const)(
    'native status reads the authenticated network %s record without asking other holders or writing',
    async state => {
        const result = await checkCredentialStatus(
            {
                getStatuses: async uris => {
                    expect(uris).toEqual(['held']);
                    return { held: state };
                },
                verify: async () => {
                    throw new Error('Network result should not require a list');
                },
            },
            'held',
            raw
        );
        expect(result).toMatchObject({
            state,
            source: 'network',
            purposes: ['revocation', 'suspension'],
        });
        expect(Date.parse(result.checkedAt!)).toBeGreaterThan(0);
    }
);

test('fallback binds structured results to the original status entry, and never parses error prose', async () => {
    const frozen = JSON.stringify(raw);
    expect(
        (
            await checkCredentialStatus(
                reader({ errors: ['Credential revoked'], status: [outcome(true)] }),
                'external',
                raw
            )
        ).state
    ).toBe('revoked');
    expect(
        await checkCredentialStatus(
            reader({ errors: [], status: [outcome(false)] }),
            'external',
            raw
        )
    ).toMatchObject({ state: 'active', source: 'statusList', purposes: ['revocation'] });
    for (const result of [
        { errors: ['not revoked; suspension server unavailable'] },
        { errors: [], status: [] },
        { errors: [], status: [{ ...outcome(true), statusListIndex: 'other' }] },
        { errors: [], status: [{ ...outcome(false), isSet: 'false' }] },
        { errors: ['one check failed'], status: [outcome(false)] },
    ])
        expect((await checkCredentialStatus(reader(result), 'external', raw)).state).toBe(
            'unavailable'
        );
    expect(JSON.stringify(raw)).toBe(frozen);
    const legacy = {
        type: 'RevocationList2020Status',
        revocationListCredential: entry.statusListCredential,
        revocationListIndex: '7',
    };
    expect(
        (
            await checkCredentialStatus(
                reader({ errors: [], status: [{ ...outcome(true), entryType: legacy.type }] }),
                'external',
                { credentialStatus: legacy }
            )
        ).state
    ).toBe('revoked');
    const unknown = { ...entry, type: 'CustomStatus' };
    expect(
        (
            await checkCredentialStatus(
                reader({ errors: [], status: [{ ...outcome(true), entryType: unknown.type }] }),
                'external',
                { credentialStatus: unknown }
            )
        ).state
    ).toBe('unavailable');
});

test('suspension, partial results and nested certified boosts remain distinct from fully checked active', async () => {
    const suspension = { ...entry, statusPurpose: 'suspension', statusListIndex: '8' };
    const suspended = { ...suspension, entryType: suspension.type, isSet: true };
    const both = { credentialStatus: [entry, suspension] };
    expect(
        (
            await checkCredentialStatus(
                reader({ errors: [], status: [outcome(false), suspended] }),
                'external',
                both
            )
        ).state
    ).toBe('suspended');
    expect(
        (
            await checkCredentialStatus(
                reader({ errors: [], status: [outcome(false)] }),
                'external',
                both
            )
        ).state
    ).toBe('unavailable');
    expect(
        (
            await checkCredentialStatus(
                reader({ errors: [], status: [outcome(true), suspended] }),
                'external',
                both
            )
        ).state
    ).toBe('revoked');
    expect(
        (
            await checkCredentialStatus(
                reader({ errors: [], status: [outcome(true)] }),
                'external',
                { boostCredential: raw }
            )
        ).state
    ).toBe('revoked');
});

test('network omission/outage, absent metadata, failed proof and timeout never imply active or revoked', async () => {
    const offline: CredentialStatusReader = {
        ...reader({}),
        getStatuses: async () => {
            throw new Error('Offline');
        },
    };
    expect((await checkCredentialStatus(offline, 'self', {})).state).toBe('unavailable');
    expect((await checkCredentialStatus(reader({}), 'self', {})).state).toBe('notProvided');
    expect(
        (
            await checkCredentialStatus(
                {
                    ...offline,
                    verify: async () => {
                        throw new Error('No list');
                    },
                },
                'external',
                raw
            )
        ).state
    ).toBe('unavailable');
    let listReads = 0;
    const invalid: CredentialStatusReader = {
        ...offline,
        verify: async (_, checks) => {
            if (checks[0] === 'credentialStatus') listReads++;
            return { errors: ['Invalid proof'], status: [outcome(true)] };
        },
    };
    expect((await checkCredentialStatus(invalid, 'altered', raw)).state).toBe('unavailable');
    expect(listReads).toBe(0);
    const hanging = { ...offline, verify: () => new Promise<unknown>(() => {}) };
    expect((await checkCredentialStatus(hanging, 'external', raw, 5)).state).toBe('unavailable');
    const missing: CredentialStatusReader = {
        ...reader({ errors: [], status: [outcome(false)] }),
        getStatuses: async () => ({ another: 'revoked', external: 'unexpected' }),
    };
    expect((await checkCredentialStatus(missing, 'external', raw)).state).toBe('active');
});

test('the bundled SDK checks real signed revocation and suspension lists without changing the source credential', async () => {
    const wasm = await readFile(
        new URL(
            '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm',
            import.meta.url
        )
    );
    const wallet = await initLearnCard({ seed: 'b'.repeat(64), didkit: wasm });
    const lists = new Map<string, unknown>();
    const server = Bun.serve({
        hostname: '127.0.0.1',
        port: 0,
        fetch(request) {
            const list = lists.get(new URL(request.url).pathname);
            return list ? Response.json(list) : new Response('Unavailable', { status: 503 });
        },
    });
    try {
        for (const purpose of ['revocation', 'suspension'] as const) {
            for (const set of [false, true]) {
                const path = `/${purpose}-${set}`;
                const url = `http://127.0.0.1:${server.port}${path}`;
                const bytes = Buffer.alloc(16_384);
                if (set) bytes[0] = 128;
                const statusList = await wallet.invoke.issueCredential({
                    '@context': ['https://www.w3.org/ns/credentials/v2'],
                    id: url,
                    type: ['VerifiableCredential', 'BitstringStatusListCredential'],
                    issuer: wallet.id.did(),
                    validFrom: new Date().toISOString(),
                    credentialSubject: {
                        type: 'BitstringStatusList',
                        statusPurpose: purpose,
                        encodedList: `u${gzipSync(bytes).toString('base64url')}`,
                    },
                } as never);
                lists.set(path, statusList);
                const credential = await wallet.invoke.issueCredential({
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://www.w3.org/ns/credentials/examples/v2',
                    ],
                    type: ['VerifiableCredential'],
                    issuer: wallet.id.did(),
                    validFrom: new Date().toISOString(),
                    credentialSubject: { id: wallet.id.did(), name: 'Native status test' },
                    credentialStatus: {
                        ...entry,
                        statusPurpose: purpose,
                        statusListCredential: url,
                    },
                } as never);
                const original = JSON.stringify(credential);
                const result = await checkCredentialStatus(
                    {
                        getStatuses: async () => ({}),
                        verify: (value, checks) =>
                            wallet.invoke.verifyCredential(value as never, { checks }),
                    },
                    'external',
                    credential as unknown as Record<string, unknown>
                );
                expect(result).toMatchObject({
                    state: set ? (purpose === 'revocation' ? 'revoked' : 'suspended') : 'active',
                    source: 'statusList',
                    purposes: [purpose],
                });
                expect(JSON.stringify(credential)).toBe(original);
                // A fetched list with an altered signed claim must not invent a revocation.
                if (purpose === 'revocation') {
                    const broken = structuredClone(statusList);
                    const alteredBytes = Buffer.alloc(16_384);
                    if (!set) alteredBytes[0] = 128;
                    (broken.credentialSubject as Record<string, unknown>).encodedList =
                        `u${gzipSync(alteredBytes).toString('base64url')}`;
                    lists.set(path, broken);
                    const bad = await checkCredentialStatus(
                        {
                            getStatuses: async () => ({}),
                            verify: (value, checks) =>
                                wallet.invoke.verifyCredential(value as never, { checks }),
                        },
                        'external',
                        credential as unknown as Record<string, unknown>
                    );
                    expect(bad.state).toBe('unavailable');
                }
            }
        }
    } finally {
        server.stop(true);
    }
}, 60_000);
