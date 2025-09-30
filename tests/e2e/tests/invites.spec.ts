import { describe, test, expect } from 'vitest';
import { randomBytes } from 'crypto';

import { getLearnCard } from './helpers/learncard.helpers';

const uniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const makeUser = async (prefix: string) => {
    const seed = randomBytes(32).toString('hex');

    const lc = await getLearnCard(seed);

    const profileId = uniqueId(prefix);

    await lc.invoke.createProfile({
        profileId,
        displayName: profileId,
        bio: '',
        shortBio: '',
    });

    return { lc, profileId } as const;
};

describe('Profile Connection Invites', () => {
    test('(1) default single-use invite can be consumed once, then disappears from list', async () => {
        const { lc: inviter, profileId: inviterId } = await makeUser('inviter1');
        const { lc: joiner } = await makeUser('joiner1');

        const { challenge, expiresIn, profileId } = await inviter.invoke.generateInvite(undefined, 0);

        expect(profileId).toBe(inviterId);
        expect(challenge).toBeTypeOf('string');
        expect(expiresIn === null || typeof expiresIn === 'number').toBeTruthy();

        const beforeList = await inviter.invoke.listInvites();

        const before = beforeList.find(i => i.challenge === challenge);
        expect(before).toBeDefined();
        expect(before?.usesRemaining).toBe(1);
        expect(before?.maxUses).toBe(1);

        const connected = await joiner.invoke.connectWithInvite(inviterId, challenge);
        expect(connected).toBe(true);

        const afterList = await inviter.invoke.listInvites();

        const after = afterList.find(i => i.challenge === challenge);
        expect(after).toBeUndefined();
    });

    test('(2) multi-use invite decrements usesRemaining and blocks after exhaustion', async () => {
        const { lc: inviter, profileId: inviterId } = await makeUser('inviter2');
        const { lc: joinerA } = await makeUser('joiner2a');
        const { lc: joinerB } = await makeUser('joiner2b');
        const { lc: extra } = await makeUser('extra2');

        const { challenge } = await inviter.invoke.generateInvite(undefined, 0, 2);

        let list1 = await inviter.invoke.listInvites();
        let item1 = list1.find(i => i.challenge === challenge);
        expect(item1).toBeDefined();
        expect(item1?.usesRemaining).toBe(2);
        expect(item1?.maxUses).toBe(2);

        const ok1 = await joinerA.invoke.connectWithInvite(inviterId, challenge);
        expect(ok1).toBe(true);

        let list2 = await inviter.invoke.listInvites();
        let item2 = list2.find(i => i.challenge === challenge);
        expect(item2).toBeDefined();
        expect(item2?.usesRemaining).toBe(1);
        expect(item2?.maxUses).toBe(2);

        const ok2 = await joinerB.invoke.connectWithInvite(inviterId, challenge);
        expect(ok2).toBe(true);

        // Now exhausted; should be omitted from list and cannot be used again
        let list3 = await inviter.invoke.listInvites();
        let item3 = list3.find(i => i.challenge === challenge);
        expect(item3).toBeUndefined();

        await expect(extra.invoke.connectWithInvite(inviterId, challenge)).rejects.toThrow();
    });

    test('(3) unlimited invite (maxUses=0) can be reused and appears with null usage fields; invalidateInvite revokes it', async () => {
        const { lc: inviter, profileId: inviterId } = await makeUser('inviter3');
        const { lc: joinerA } = await makeUser('joiner3a');
        const { lc: joinerB } = await makeUser('joiner3b');
        const { lc: joinerC } = await makeUser('joiner3c');

        const { challenge } = await inviter.invoke.generateInvite(undefined, 0, 0);

        const list = await inviter.invoke.listInvites();
        const item = list.find(i => i.challenge === challenge);
        expect(item).toBeDefined();
        expect(item?.usesRemaining).toBeNull();
        expect(item?.maxUses).toBeNull();

        const ok1 = await joinerA.invoke.connectWithInvite(inviterId, challenge);
        expect(ok1).toBe(true);

        const ok2 = await joinerB.invoke.connectWithInvite(inviterId, challenge);
        expect(ok2).toBe(true);

        // Should still be present in list with nulls
        const list2 = await inviter.invoke.listInvites();
        const item2 = list2.find(i => i.challenge === challenge);
        expect(item2).toBeDefined();
        expect(item2?.usesRemaining).toBeNull();
        expect(item2?.maxUses).toBeNull();

        const invalidated = await inviter.invoke.invalidateInvite(challenge);
        expect(invalidated).toBe(true);

        // After invalidation, should no longer be listed and cannot be used
        const list3 = await inviter.invoke.listInvites();
        expect(list3.find(i => i.challenge === challenge)).toBeUndefined();

        await expect(joinerC.invoke.connectWithInvite(inviterId, challenge)).rejects.toThrow();
    });
});
