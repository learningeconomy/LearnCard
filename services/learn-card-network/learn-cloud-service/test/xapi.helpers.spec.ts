import { beforeEach, describe, expect, it, vi } from 'vitest';

import { areDidsEqual } from '@helpers/did.helpers';
import { verifyVoidStatement } from '@helpers/xapi.helpers';

vi.mock('../src/constants/xapi', () => ({
    XAPI_ENDPOINT: 'https://example.com/xapi',
    XAPI_CONTRACT_URI_EXTENSION: 'https://learncard.com/xapi/extensions/contractUri',
}));

vi.mock('@helpers/did.helpers', () => ({
    areDidsEqual: vi.fn(),
}));

const fetchMock = vi.fn();
const areDidsEqualMock = vi.mocked(areDidsEqual);

describe('verifyVoidStatement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', fetchMock);
        areDidsEqualMock.mockImplementation(async (left, right) => left === right);
    });

    it.each([{ actor: null }, {}])('returns false for a missing or null actor', async statement => {
        fetchMock.mockResolvedValue({
            status: 200,
            json: vi.fn().mockResolvedValue(statement),
        });

        await expect(
            verifyVoidStatement(
                'did:example:target',
                'did:example:requester',
                'statement-id',
                'auth'
            )
        ).resolves.toBe(false);
    });

    it('accepts a valid actor and group authority', async () => {
        fetchMock.mockResolvedValue({
            status: 200,
            json: vi.fn().mockResolvedValue({
                actor: { account: { name: 'did:example:target' } },
                authority: {
                    objectType: 'Group',
                    member: [{ account: { name: 'did:example:requester' } }],
                },
            }),
        });

        await expect(
            verifyVoidStatement(
                'did:example:target',
                'did:example:requester',
                'statement-id',
                'auth'
            )
        ).resolves.toBe(true);
    });

    it('accepts authority members when objectType is omitted', async () => {
        fetchMock.mockResolvedValue({
            status: 200,
            json: vi.fn().mockResolvedValue({
                actor: { account: { name: 'did:example:target' } },
                authority: {
                    member: [{ account: { name: 'did:example:requester' } }],
                },
            }),
        });

        await expect(
            verifyVoidStatement(
                'did:example:target',
                'did:example:requester',
                'statement-id',
                'auth'
            )
        ).resolves.toBe(true);
    });

    it.each(['Agent', 'CustomAuthority'])(
        'accepts authority members when objectType is %s',
        async objectType => {
            fetchMock.mockResolvedValue({
                status: 200,
                json: vi.fn().mockResolvedValue({
                    actor: { account: { name: 'did:example:target' } },
                    authority: {
                        objectType,
                        member: [{ account: { name: 'did:example:requester' } }],
                    },
                }),
            });

            await expect(
                verifyVoidStatement(
                    'did:example:target',
                    'did:example:requester',
                    'statement-id',
                    'auth'
                )
            ).resolves.toBe(true);
        }
    );

    it.each([undefined, null, {}, 'not-an-array', [{}], [null], [{ account: { name: 123 } }]])(
        'rejects a malformed authority member value: %j',
        async member => {
            fetchMock.mockResolvedValue({
                status: 200,
                json: vi.fn().mockResolvedValue({
                    actor: { account: { name: 'did:example:target' } },
                    authority: { objectType: 'Group', member },
                }),
            });

            await expect(
                verifyVoidStatement(
                    'did:example:target',
                    'did:example:requester',
                    'statement-id',
                    'auth'
                )
            ).resolves.toBe(false);
        }
    );

    it('rejects a missing authority', async () => {
        fetchMock.mockResolvedValue({
            status: 200,
            json: vi.fn().mockResolvedValue({
                actor: { account: { name: 'did:example:target' } },
            }),
        });

        await expect(
            verifyVoidStatement(
                'did:example:target',
                'did:example:requester',
                'statement-id',
                'auth'
            )
        ).resolves.toBe(false);
    });
});
