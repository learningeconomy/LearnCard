import { readFile } from 'node:fs/promises';
import { generateLearnCard } from '@learncard/core';
import { getDidKitPlugin } from '@learncard/didkit-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import { getClient as getBrainClient } from '@learncard/network-brain-client';
import { vi, expect, it } from 'vitest';
import { getLearnCardNetworkPlugin } from '../';
import { SAMPLE_VCS } from './mocks/sample-vcs';

vi.mock('@learncard/network-brain-client', () => ({
    getClient: vi.fn(),
    getApiTokenClient: vi.fn(),
}));

it('preserves valid siblings through finalization and recovery despite wrong-key and credential-validation failures', async () => {
    const didkit = readFile(
        require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
    );
    const makeCard = async (seed: string) => {
        const card = await (await generateLearnCard()).addPlugin(await getDidKitPlugin(didkit));
        const identity = await card.addPlugin(await getDidKeyPlugin(card, seed, 'key'));
        return identity.addPlugin(await getVCPlugin(identity));
    };
    const holder = await makeCard('a'.repeat(64));
    const otherHolder = await makeCard('b'.repeat(64));
    const credential = SAMPLE_VCS.VALID_BOOST;
    const wrongHolderJwe = await holder.invoke.createDagJwe(credential, [otherHolder.id.did()]);
    const validJwe = await holder.invoke.createDagJwe(credential, [holder.id.did()]);
    const invalidCredentialJwe = await holder.invoke.createDagJwe({}, [holder.id.did()]);
    const deliveries = [
        { id: 'wrong-holder', credential: wrongHolderJwe },
        { id: 'invalid-credential', credential: invalidCredentialJwe },
        { id: 'valid-sibling', credential: validJwe },
    ];
    const client = {
        profile: { getProfile: { query: vi.fn().mockResolvedValue({ did: holder.id.did() }) } },
        inbox: {
            finalize: {
                mutate: vi
                    .fn()
                    .mockResolvedValue({ processed: 3, claimed: 3, errors: 0, deliveries }),
            },
            getMyInboxDeliveries: {
                query: vi.fn().mockResolvedValue({ records: deliveries, hasMore: false }),
            },
        },
    };
    vi.mocked(getBrainClient).mockResolvedValue(client as never);
    const plugin = await getLearnCardNetworkPlugin(holder, 'https://network.example');
    const network = await holder.addPlugin(plugin);

    const result = await network.invoke.finalizeInboxCredentials();
    expect(result.deliveries).toEqual([{ id: 'valid-sibling', credential }]);
    expect(result.verifiableCredentials).toEqual([credential]);
    expect(result.errors).toBe(2);

    const recovery = await network.invoke.recoverInboxCredentials({});
    expect(recovery.records).toEqual([{ id: 'valid-sibling', credential }]);
    expect(recovery.failed).toBe(2);
});
