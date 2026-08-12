import { webcrypto } from 'node:crypto';

import JSZip from 'jszip';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLearnCardBundle } from '../exportBundle';
import { sha256Hex } from '../crypto';
import { computePayloadSha256 } from '../manifest';
import { readLearnCardBundleSeedData, restoreLearnCardFromBundleData } from '../restoreBundle';
import type { JsonValue, LearnCardBundleWallet } from '../types';

const { initLearnCardMock } = vi.hoisted(() => ({ initLearnCardMock: vi.fn() }));

vi.mock('@learncard/init', () => ({
    initLearnCard: initLearnCardMock,
}));

const createWallet = (): LearnCardBundleWallet & {
    stored: JsonValue[];
    added: Array<Record<string, unknown>>;
} => ({
    stored: [],
    added: [],
    id: {
        did: method => (method ? `did:${method}:holder` : 'did:key:holder'),
        keypair: (algorithm = 'ed25519') => ({
            kty: 'OKP',
            crv: algorithm,
            d: `${algorithm}-private`,
        }),
    },
    invoke: {
        getKey: () => '1'.repeat(64),
        resolveDid: async did => ({ id: did, verificationMethod: [] }),
    },
    index: {
        LearnCloud: {
            get: async () => [],
            add: async record => record,
        },
    },
    read: {
        get: async () => undefined,
    },
    store: {
        LearnCloud: {},
    },
});

beforeAll(() => {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
});

beforeEach(() => {
    initLearnCardMock.mockReset();
    initLearnCardMock.mockResolvedValue({ restored: true });
});

describe('restore helpers', () => {
    it('reads the exported seed from an encrypted bundle', async () => {
        const bundle = await createLearnCardBundle(createWallet(), {
            password: 'correct horse battery staple',
            fetchStatusLists: false,
        });

        await expect(
            readLearnCardBundleSeedData(bundle.data, { password: 'correct horse battery staple' })
        ).resolves.toBe('1'.repeat(64));
    });

    it('restores a LearnCard by passing the exported seed to initLearnCard', async () => {
        const bundle = await createLearnCardBundle(createWallet(), {
            password: 'correct horse battery staple',
            fetchStatusLists: false,
        });

        const restored = await restoreLearnCardFromBundleData(bundle.data, {
            password: 'correct horse battery staple',
            init: { network: true, allowRemoteContexts: true, didkit: 'node' },
        });

        expect(initLearnCardMock).toHaveBeenCalledWith({
            seed: '1'.repeat(64),
            network: true,
            allowRemoteContexts: true,
            didkit: 'node',
        });
        expect(restored).toEqual({ restored: true });
    });

    it('rejects malformed exported seeds', async () => {
        const bundle = await createLearnCardBundle(createWallet(), {
            password: 'correct horse battery staple',
            fetchStatusLists: false,
        });
        const zip = await JSZip.loadAsync(bundle.data);
        const seedPath = 'keys/private-key-seed.txt.enc';
        const tamperedSeed = `${'f'.repeat(63)}\n`;
        const contents = bundle.manifest.contents.map(entry =>
            entry.path === seedPath
                ? { ...entry, encrypted: false, sha256: sha256Hex(tamperedSeed) }
                : entry
        );
        const manifest = {
            ...bundle.manifest,
            contents,
            payloadSha256: computePayloadSha256(contents),
        };

        zip.file(seedPath, tamperedSeed, { date: new Date('2024-01-01T00:00:00.000Z') });
        zip.file('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);

        const data = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

        await expect(
            readLearnCardBundleSeedData(data, { password: 'correct horse battery staple' })
        ).rejects.toThrow(
            'LearnCard bundle key-private-seed must be exactly 64 hexadecimal characters'
        );
    });
});
