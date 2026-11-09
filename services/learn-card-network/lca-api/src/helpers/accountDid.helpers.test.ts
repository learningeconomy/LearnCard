import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findUserKeyByDid: vi.fn(), resolveDid: vi.fn() }));
vi.mock('../models/UserKey', () => ({ findUserKeyByDid: mocks.findUserKeyByDid }));
vi.mock('@helpers/learnCard.helpers', () => ({
    getEmptyLearnCard: async () => ({ invoke: { resolveDid: mocks.resolveDid } }),
}));

import { getOwnerKeyDid, resolveAccountDid } from './accountDid.helpers';

const webDid = 'did:web:network.example:users:student';
const multibase = 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
const keyDid = `did:key:${multibase}`;
const segment = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const bearer = (kid: string) => `Bearer ${segment({ alg: 'EdDSA', kid })}.${segment({})}.sig`;
const document = (owner = multibase) => ({
    verificationMethod: [
        { id: `${webDid}#owner`, publicKeyMultibase: owner },
        { id: `${webDid}#signing-authority`, publicKeyMultibase: 'z6MkotherKey' },
    ],
});

beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveDid.mockResolvedValue(document());
    mocks.findUserKeyByDid.mockImplementation(async (did: string) =>
        did === keyDid ? { primaryDid: keyDid } : null
    );
});

describe('resolveAccountDid', () => {
    it('resolves a profile did:web signed with its #owner key to the account did:key', async () => {
        expect(await resolveAccountDid(webDid, bearer(`${webDid}#owner`))).toBe(keyDid);
    });

    it('keeps a DID that already has an account without resolving anything', async () => {
        mocks.findUserKeyByDid.mockResolvedValue({ primaryDid: webDid });
        expect(await resolveAccountDid(webDid, bearer(`${webDid}#owner`))).toBe(webDid);
        expect(mocks.resolveDid).not.toHaveBeenCalled();
    });

    it('never follows a key other than #owner (e.g. a signing authority)', async () => {
        expect(await resolveAccountDid(webDid, bearer(`${webDid}#signing-authority`))).toBe(webDid);
        expect(mocks.resolveDid).not.toHaveBeenCalled();
    });

    it('ignores a kid for a different DID', async () => {
        const other = 'did:web:network.example:users:someone-else';
        expect(await resolveAccountDid(webDid, bearer(`${other}#owner`))).toBe(webDid);
    });

    it('keeps the did:web when the derived did:key has no account', async () => {
        mocks.resolveDid.mockResolvedValue(
            document('z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH')
        );
        expect(await resolveAccountDid(webDid, bearer(`${webDid}#owner`))).toBe(webDid);
    });

    it('fails safe on a missing header, malformed key or resolution error', async () => {
        expect(await resolveAccountDid(webDid)).toBe(webDid);
        expect(await resolveAccountDid(webDid, 'Bearer not-a-jwt')).toBe(webDid);
        mocks.resolveDid.mockResolvedValueOnce(document('not-multibase'));
        expect(await resolveAccountDid(webDid, bearer(`${webDid}#owner`))).toBe(webDid);
        mocks.resolveDid.mockRejectedValueOnce(new Error('unreachable'));
        expect(await resolveAccountDid(webDid, bearer(`${webDid}#owner`))).toBe(webDid);
    });

    it('leaves did:key callers untouched', async () => {
        expect(await resolveAccountDid('did:key:zSomething')).toBe('did:key:zSomething');
        expect(
            await getOwnerKeyDid('did:key:zSomething', bearer('did:key:zSomething#x'))
        ).toBeUndefined();
    });
});
