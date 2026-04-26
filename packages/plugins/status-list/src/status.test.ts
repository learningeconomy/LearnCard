/**
 * Unit tests for `vp/status.ts` — the W3C Bitstring Status List
 * v1.0 (and StatusList2021 legacy alias) revocation/suspension
 * checker.
 *
 * Strategy: every test builds an in-process Status List Credential
 * with `buildBitstringStatusListCredential`, mounts it via the
 * injected `fetchStatusList` lookup, and asserts the outcome. No
 * real HTTP — but the encode pipeline (GZIP + base64url + bit
 * layout) IS exercised end-to-end on the real wire format we emit
 * to verifiers.
 *
 * Coverage matrix:
 *   - active / revoked / suspended outcomes for both
 *     `BitstringStatusListEntry` and `StatusList2021Entry`
 *     entry types
 *   - bit-layout invariants (high-order-first, byte-boundary
 *     transitions, multi-byte indices)
 *   - missing / malformed entries (invalid index, out-of-range
 *     index, no statusListCredential)
 *   - multiple credentialStatus entries on a single credential
 *     (any-set-bit-wins semantics)
 *   - unknown entry types (strict vs lax mode)
 *   - statusSize > 1 (deferred multi-bit purposes)
 *   - JWKS resolution: inline `fetchStatusList` lookup, fetch
 *     error surfaces typed
 *   - encoding edge cases: multibase 'u' prefix, non-GZIP payload,
 *     malformed base64
 */
import {
    StatusCheckError,
    checkCredentialStatus,
    type CredentialWithStatus,
    type StatusListCredential,
} from './status';
import { buildBitstringStatusListCredential } from './test-helpers';

const LIST_URL = 'https://example.org/credentials/status/1';

const credentialAt = (
    index: number,
    overrides: { type?: string; purpose?: string; statusSize?: number } = {}
): CredentialWithStatus => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2024-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
    credentialStatus: {
        id: `${LIST_URL}#${index}`,
        type: overrides.type ?? 'BitstringStatusListEntry',
        statusPurpose: overrides.purpose ?? 'revocation',
        statusListIndex: String(index),
        statusListCredential: LIST_URL,
        ...(overrides.statusSize !== undefined ? { statusSize: overrides.statusSize } : {}),
    },
});

/* -------------------------------------------------------------------------- */
/*                            outcome happy paths                             */
/* -------------------------------------------------------------------------- */

describe('checkCredentialStatus — basic outcomes', () => {
    it('returns active when the bit at the credential index is 0', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [10, 20, 30] });
        const result = await checkCredentialStatus(credentialAt(42), {
            fetchStatusList: async () => list,
        });

        expect(result.outcome).toBe('active');
        expect(result.listIndex).toBe(42);
        expect(result.listUrl).toBe(LIST_URL);
        expect(result.purpose).toBe('revocation');
    });

    it('returns revoked when the bit is 1 and the purpose is revocation', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [42] });
        const result = await checkCredentialStatus(credentialAt(42), {
            fetchStatusList: async () => list,
        });

        expect(result.outcome).toBe('revoked');
        expect(result.listIndex).toBe(42);
        expect(result.purpose).toBe('revocation');
    });

    it('returns suspended when the purpose is suspension', async () => {
        const list = buildBitstringStatusListCredential({
            bitsSet: [42],
            statusPurpose: 'suspension',
        });
        const result = await checkCredentialStatus(
            credentialAt(42, { purpose: 'suspension' }),
            { fetchStatusList: async () => list }
        );

        expect(result.outcome).toBe('suspended');
        expect(result.purpose).toBe('suspension');
    });

    it('returns no_status when the credential has no credentialStatus entry', async () => {
        const result = await checkCredentialStatus({
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:subject' },
        });

        expect(result.outcome).toBe('no_status');
    });

    it('falls through to revoked for an unrecognised purpose (conservative default)', async () => {
        // The spec lets issuers invent custom purposes. A wallet
        // seeing a set bit with an unfamiliar purpose should treat
        // it as a refusal-to-honour signal — the alternative
        // (silently ignoring it) is unsafe.
        const list = buildBitstringStatusListCredential({
            bitsSet: [7],
            statusPurpose: 'embargo',
        });
        const result = await checkCredentialStatus(
            credentialAt(7, { purpose: 'embargo' }),
            { fetchStatusList: async () => list }
        );

        expect(result.outcome).toBe('revoked');
        expect(result.purpose).toBe('embargo');
    });
});

/* -------------------------------------------------------------------------- */
/*                          legacy StatusList2021 entry                       */
/* -------------------------------------------------------------------------- */

describe('checkCredentialStatus — StatusList2021 legacy entry type', () => {
    it('decodes the same bitstring layout under the legacy entry type', async () => {
        // OBv3 issuers and many production deployments still emit
        // the old type string. Encoding is identical to
        // BitstringStatusListEntry — only the entry's `type`
        // discriminator differs.
        const list = buildBitstringStatusListCredential({ bitsSet: [99] });
        const result = await checkCredentialStatus(
            credentialAt(99, { type: 'StatusList2021Entry' }),
            { fetchStatusList: async () => list }
        );

        expect(result.outcome).toBe('revoked');
    });

    it('returns active for unset indices under the legacy type', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [99] });
        const result = await checkCredentialStatus(
            credentialAt(100, { type: 'StatusList2021Entry' }),
            { fetchStatusList: async () => list }
        );

        expect(result.outcome).toBe('active');
    });
});

/* -------------------------------------------------------------------------- */
/*                              bit layout                                    */
/* -------------------------------------------------------------------------- */

describe('checkCredentialStatus — bit layout (high-order-bit-first)', () => {
    /**
     * Pin the bit-indexing convention with assertions across byte
     * boundaries. Index 0 = byte[0]'s high-order bit (mask 0x80);
     * index 7 = byte[0]'s low-order bit (mask 0x01); index 8 =
     * byte[1]'s high-order bit. A regression here would silently
     * mis-decode every status list.
     */

    it('index 0 lands on byte 0, bit 7 (mask 0x80)', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [0] });

        // Active everywhere except index 0.
        for (const i of [1, 2, 3, 7, 8, 16]) {
            const r = await checkCredentialStatus(credentialAt(i), {
                fetchStatusList: async () => list,
            });
            expect(r.outcome).toBe('active');
        }
        const r0 = await checkCredentialStatus(credentialAt(0), {
            fetchStatusList: async () => list,
        });
        expect(r0.outcome).toBe('revoked');
    });

    it('index 7 lands on byte 0, bit 0 (mask 0x01) — byte boundary', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [7] });
        const r7 = await checkCredentialStatus(credentialAt(7), {
            fetchStatusList: async () => list,
        });
        const r6 = await checkCredentialStatus(credentialAt(6), {
            fetchStatusList: async () => list,
        });
        const r8 = await checkCredentialStatus(credentialAt(8), {
            fetchStatusList: async () => list,
        });

        expect(r7.outcome).toBe('revoked');
        expect(r6.outcome).toBe('active');
        expect(r8.outcome).toBe('active');
    });

    it('index 8 lands on byte 1, bit 7 (next byte high-order bit)', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [8] });
        const r8 = await checkCredentialStatus(credentialAt(8), {
            fetchStatusList: async () => list,
        });
        const r0 = await checkCredentialStatus(credentialAt(0), {
            fetchStatusList: async () => list,
        });

        expect(r8.outcome).toBe('revoked');
        expect(r0.outcome).toBe('active');
    });

    it('handles indices well into the bitstring (multi-kilobyte offsets)', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [100_000] });
        const r = await checkCredentialStatus(credentialAt(100_000), {
            fetchStatusList: async () => list,
        });
        expect(r.outcome).toBe('revoked');
    });
});

/* -------------------------------------------------------------------------- */
/*                       multiple entries / array shape                       */
/* -------------------------------------------------------------------------- */

describe('checkCredentialStatus — multiple credentialStatus entries', () => {
    it('returns the first non-active outcome when entries are an array', async () => {
        // A credential carrying both a revocation entry (active)
        // and a suspension entry (set) should report `suspended`,
        // not `active`. Iteration order is the entry's declaration
        // order.
        const revocationList = buildBitstringStatusListCredential({
            bitsSet: [1],
            statusPurpose: 'revocation',
        });
        const suspensionList = buildBitstringStatusListCredential({
            bitsSet: [42],
            statusPurpose: 'suspension',
        });

        const REV_URL = 'https://example.org/rev/1';
        const SUS_URL = 'https://example.org/sus/1';

        const fetchStatusList = async (url: string): Promise<StatusListCredential> => {
            if (url === REV_URL) return revocationList;
            if (url === SUS_URL) return suspensionList;
            throw new Error(`unexpected url: ${url}`);
        };

        const credential: CredentialWithStatus = {
            credentialStatus: [
                {
                    type: 'BitstringStatusListEntry',
                    statusPurpose: 'revocation',
                    statusListIndex: '5', // not set
                    statusListCredential: REV_URL,
                },
                {
                    type: 'BitstringStatusListEntry',
                    statusPurpose: 'suspension',
                    statusListIndex: '42', // set
                    statusListCredential: SUS_URL,
                },
            ],
        };

        const result = await checkCredentialStatus(credential, {
            fetchStatusList,
        });
        expect(result.outcome).toBe('suspended');
    });

    it('returns active when every entry is active', async () => {
        const revocationList = buildBitstringStatusListCredential({ bitsSet: [] });
        const suspensionList = buildBitstringStatusListCredential({
            bitsSet: [],
            statusPurpose: 'suspension',
        });

        const credential: CredentialWithStatus = {
            credentialStatus: [
                {
                    type: 'BitstringStatusListEntry',
                    statusPurpose: 'revocation',
                    statusListIndex: '5',
                    statusListCredential: 'https://example.org/rev/1',
                },
                {
                    type: 'BitstringStatusListEntry',
                    statusPurpose: 'suspension',
                    statusListIndex: '7',
                    statusListCredential: 'https://example.org/sus/1',
                },
            ],
        };

        const result = await checkCredentialStatus(credential, {
            fetchStatusList: async (url: string) =>
                url.includes('rev') ? revocationList : suspensionList,
        });
        expect(result.outcome).toBe('active');
    });
});

/* -------------------------------------------------------------------------- */
/*                              unsupported types                             */
/* -------------------------------------------------------------------------- */

describe('checkCredentialStatus — unsupported entry types', () => {
    it('returns unsupported_status_type for an unknown type in strict mode (default)', async () => {
        const result = await checkCredentialStatus(
            credentialAt(1, { type: 'TokenStatusList' })
        );

        expect(result.outcome).toBe('unsupported_status_type');
        expect(result.detail).toMatch(/TokenStatusList/);
    });

    it('falls back to the next entry in lax mode', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [42] });

        const credential: CredentialWithStatus = {
            credentialStatus: [
                // Unknown type — would short-circuit in strict mode.
                {
                    type: 'TokenStatusList',
                    statusListIndex: '1',
                    statusListCredential: 'https://example.org/token/1',
                },
                // Recognised type — should be checked when strictType=false.
                {
                    type: 'BitstringStatusListEntry',
                    statusPurpose: 'revocation',
                    statusListIndex: '42',
                    statusListCredential: LIST_URL,
                },
            ],
        };

        const result = await checkCredentialStatus(credential, {
            strictType: false,
            fetchStatusList: async () => list,
        });

        expect(result.outcome).toBe('revoked');
    });

    it('returns unsupported_status_type for statusSize > 1 (multi-bit message purposes)', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [] });
        const result = await checkCredentialStatus(
            credentialAt(0, { statusSize: 2 }),
            { fetchStatusList: async () => list }
        );

        expect(result.outcome).toBe('unsupported_status_type');
        expect(result.detail).toMatch(/statusSize=2/);
    });
});

/* -------------------------------------------------------------------------- */
/*                             encoding edge cases                            */
/* -------------------------------------------------------------------------- */

describe('checkCredentialStatus — encoding edge cases', () => {
    it("strips a leading multibase 'u' prefix on encodedList", async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [42] });
        const subject = (
            list.credentialSubject as { encodedList: string }
        );

        // Re-emit with the multibase prefix the spec permits.
        const prefixed: StatusListCredential = {
            ...list,
            credentialSubject: {
                ...subject,
                encodedList: `u${subject.encodedList}`,
            },
        };

        const result = await checkCredentialStatus(credentialAt(42), {
            fetchStatusList: async () => prefixed,
        });

        expect(result.outcome).toBe('revoked');
    });

    it('rejects a non-GZIP payload with invalid_status_list', async () => {
        // Plain base64-encoded "not-gzipped" — happens when buggy
        // issuers skip compression. Spec mandates GZIP; we surface
        // a typed error rather than silently treating arbitrary
        // bytes as a bitstring.
        const malformed: StatusListCredential = {
            credentialSubject: {
                type: 'BitstringStatusList',
                statusPurpose: 'revocation',
                encodedList: Buffer.from('not gzipped', 'utf8').toString('base64'),
            },
        };

        await expect(
            checkCredentialStatus(credentialAt(0), {
                fetchStatusList: async () => malformed,
            })
        ).rejects.toMatchObject({
            code: 'invalid_status_list',
            message: expect.stringMatching(/GZIP/),
        });
    });

    it('rejects an out-of-range index with index_out_of_range', async () => {
        const list = buildBitstringStatusListCredential({
            bitsSet: [],
            bitstringLengthBytes: 4, // 32 bits total
        });

        await expect(
            checkCredentialStatus(credentialAt(1_000_000), {
                fetchStatusList: async () => list,
            })
        ).rejects.toMatchObject({ code: 'index_out_of_range' });
    });

    it('rejects an entry whose statusListIndex is not an integer string', async () => {
        const credential: CredentialWithStatus = {
            credentialStatus: {
                type: 'BitstringStatusListEntry',
                statusListIndex: 'forty-two',
                statusListCredential: LIST_URL,
            },
        };

        await expect(
            checkCredentialStatus(credential, {
                fetchStatusList: async () =>
                    buildBitstringStatusListCredential({ bitsSet: [] }),
            })
        ).rejects.toMatchObject({ code: 'invalid_status_entry' });
    });

    it('rejects an entry with no statusListCredential', async () => {
        const credential: CredentialWithStatus = {
            credentialStatus: {
                type: 'BitstringStatusListEntry',
                statusListIndex: '1',
                // no statusListCredential
            },
        };

        await expect(checkCredentialStatus(credential)).rejects.toMatchObject({
            code: 'invalid_status_entry',
        });
    });
});

/* -------------------------------------------------------------------------- */
/*                                fetch path                                  */
/* -------------------------------------------------------------------------- */

describe('checkCredentialStatus — fetch path (when no fetchStatusList override)', () => {
    it('uses fetchImpl to GET the status list and parse JSON', async () => {
        const list = buildBitstringStatusListCredential({ bitsSet: [3] });
        const fetchImpl = jest.fn(async () => ({
            ok: true,
            status: 200,
            json: async () => list,
        })) as unknown as typeof fetch;

        const result = await checkCredentialStatus(credentialAt(3), {
            fetchImpl,
        });

        expect(result.outcome).toBe('revoked');
        expect(fetchImpl).toHaveBeenCalledWith(
            LIST_URL,
            expect.objectContaining({
                headers: expect.objectContaining({ Accept: expect.any(String) }),
            })
        );
    });

    it('throws list_fetch_failed for a non-2xx response', async () => {
        const fetchImpl = jest.fn(async () => ({
            ok: false,
            status: 503,
            json: async () => ({}),
        })) as unknown as typeof fetch;

        await expect(
            checkCredentialStatus(credentialAt(0), { fetchImpl })
        ).rejects.toMatchObject({ code: 'list_fetch_failed' });
    });

    it('throws list_fetch_failed when fetch itself rejects (network error)', async () => {
        const fetchImpl = jest.fn(async () => {
            throw new Error('ECONNREFUSED');
        }) as unknown as typeof fetch;

        await expect(
            checkCredentialStatus(credentialAt(0), { fetchImpl })
        ).rejects.toMatchObject({ code: 'list_fetch_failed' });
    });

    it('throws no_fetch when neither fetchImpl nor fetchStatusList is supplied AND globalThis.fetch is unavailable', async () => {
        // This test deliberately strips globalThis.fetch — covers
        // host environments (older Node, restricted runtimes) where
        // the global isn't bound.
        const original = globalThis.fetch;
        // @ts-expect-error — intentional removal for the test
        delete globalThis.fetch;

        try {
            await expect(
                checkCredentialStatus(credentialAt(0))
            ).rejects.toMatchObject({ code: 'no_fetch' });
        } finally {
            globalThis.fetch = original;
        }
    });

    it('preserves the listUrl on thrown errors for debug context', async () => {
        const fetchImpl = jest.fn(async () => {
            throw new Error('boom');
        }) as unknown as typeof fetch;

        try {
            await checkCredentialStatus(credentialAt(0), { fetchImpl });
            throw new Error('expected to throw');
        } catch (e) {
            expect(e).toBeInstanceOf(StatusCheckError);
            expect((e as StatusCheckError).listUrl).toBe(LIST_URL);
        }
    });
});

/* -------------------------------------------------------------------------- */
/*                              error class                                   */
/* -------------------------------------------------------------------------- */

describe('StatusCheckError', () => {
    it('preserves code, message, listUrl, and cause', () => {
        const cause = new Error('underlying');
        const err = new StatusCheckError('list_fetch_failed', 'wrapper', {
            cause,
            listUrl: LIST_URL,
        });

        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('StatusCheckError');
        expect(err.code).toBe('list_fetch_failed');
        expect(err.listUrl).toBe(LIST_URL);
        expect((err as { cause?: unknown }).cause).toBe(cause);
    });
});
