import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import * as LearnCardTypes from '@learncard/types';

import { getProfileByProfileId } from '@accesslayer/profile/read';
import {
    blockProfile,
    connectProfiles,
    disconnectProfiles,
    requestConnection,
    unblockProfile,
} from '@helpers/connection.helpers';
import {
    connectWithConnectionPrompt,
    createConnectionPromptsForClaim,
    getConnectionPromptStatus,
    getPendingConnectionPrompts,
    skipConnectionPrompt,
} from '@helpers/connectionPrompt.helpers';
import { neogma } from '@instance';
import { Profile } from '@models';
import { ProfileType } from 'types/profile';

import { getUser } from './helpers/getClient';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let profileA: ProfileType;
let profileB: ProfileType;

const createPrompts = (triggerId: string) =>
    createConnectionPromptsForClaim({
        claimer: profileB,
        sender: profileA,
        triggerId,
    });

describe('connection prompt public contracts', () => {
    it('validates the public prompt shape', () => {
        const validator = (
            LearnCardTypes as unknown as {
                LCNConnectionPromptValidator?: {
                    safeParse: (value: unknown) => { success: boolean };
                };
            }
        ).LCNConnectionPromptValidator;

        expect(
            validator?.safeParse({
                promptId: '00000000-0000-4000-8000-000000000001',
                status: 'PENDING',
                surface: 'POST_CLAIM',
                triggerId: 'credential:claim-1',
                triggeredAt: '2026-08-20T12:00:00.000Z',
                updatedAt: '2026-08-20T12:00:00.000Z',
                counterpart: { profileId: 'usera' },
            }).success
        ).toBe(true);
    });

    it('accepts stale as an action result without making it durable prompt state', () => {
        const validators = LearnCardTypes as unknown as {
            LCNConnectionPromptValidator?: {
                safeParse: (value: unknown) => { success: boolean };
            };
            LCNConnectionPromptActionResultValidator?: {
                safeParse: (value: unknown) => { success: boolean };
            };
        };

        expect(
            validators.LCNConnectionPromptActionResultValidator?.safeParse({
                promptId: '00000000-0000-4000-8000-000000000001',
                status: 'STALE',
            }).success
        ).toBe(true);
        expect(
            validators.LCNConnectionPromptValidator?.safeParse({
                promptId: '00000000-0000-4000-8000-000000000001',
                status: 'STALE',
                surface: 'POST_CLAIM',
                triggerId: 'credential:claim-1',
                triggeredAt: '2026-08-20T12:00:00.000Z',
                updatedAt: '2026-08-20T12:00:00.000Z',
                counterpart: { profileId: 'usera' },
            }).success
        ).toBe(false);
    });

    it('validates typed connection prompt notification metadata', () => {
        const validator = (
            LearnCardTypes as unknown as {
                LCNNotificationMetadataValidator?: {
                    safeParse: (value: unknown) => { success: boolean };
                };
            }
        ).LCNNotificationMetadataValidator;

        expect(
            validator?.safeParse({
                connectionPrompt: {
                    promptId: '00000000-0000-4000-8000-000000000001',
                    counterpartProfileId: 'usera',
                },
                existingMetadata: true,
            }).success
        ).toBe(true);
    });
});

describe('credential claim connection prompts', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        profileA = (await getProfileByProfileId('usera'))!;
        profileB = (await getProfileByProfileId('userb'))!;
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
    });

    it('creates independent claimer and sender prompts for one claim', async () => {
        const created = await createPrompts('credential:claim-1');

        expect(created.claimerPrompt?.surface).toBe('POST_CLAIM');
        expect(created.senderPrompt?.surface).toBe('NOTIFICATION');
        const [claimerPrompt] = await getPendingConnectionPrompts(profileB);

        expect(claimerPrompt).toBeDefined();
        expect(claimerPrompt?.counterpart).not.toHaveProperty('did');
        expect(claimerPrompt?.counterpart).not.toHaveProperty('bio');
        expect(claimerPrompt?.counterpart).not.toHaveProperty('email');
        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(1);
    });

    it('does not reopen a skipped prompt for the same trigger but reopens for a later claim', async () => {
        const first = await createPrompts('credential:claim-1');
        await skipConnectionPrompt(profileB, first.claimerPrompt!.promptId);

        await createPrompts('credential:claim-1');
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);

        const later = await createPrompts('credential:claim-2');
        expect(later.claimerPrompt?.promptId).not.toBe(first.claimerPrompt?.promptId);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(1);
    });

    it('keeps the counterpart prompt pending when one participant skips', async () => {
        const created = await createPrompts('credential:claim-1');

        await skipConnectionPrompt(profileB, created.claimerPrompt!.promptId);

        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(1);
    });

    it('preserves the pending prompt identity when another claim arrives', async () => {
        const first = await createPrompts('credential:claim-1');
        const repeated = await createPrompts('credential:claim-2');

        expect(repeated.claimerPrompt?.promptId).toBe(first.claimerPrompt?.promptId);
        expect(repeated.claimerPrompt?.isNew).toBe(false);
        expect(repeated.senderPrompt?.promptId).toBe(first.senderPrompt?.promptId);
        expect(repeated.senderPrompt?.isNew).toBe(false);
    });

    it('does not create prompts for a claim sent to self', async () => {
        const result = await createConnectionPromptsForClaim({
            claimer: profileA,
            sender: profileA,
            triggerId: 'credential:self',
        });

        expect(result).toEqual({});
    });

    it('does not create prompts involving a service profile', async () => {
        await neogma.queryRunner.run(
            'MATCH (profile:Profile { profileId: $profileId }) SET profile.isServiceProfile = true',
            { profileId: profileA.profileId }
        );
        profileA = (await getProfileByProfileId('usera'))!;

        expect(await createPrompts('credential:service')).toEqual({});
    });

    it('does not create prompts for a blocked pair', async () => {
        await blockProfile(profileA, profileB);

        expect(await createPrompts('credential:blocked')).toEqual({});
    });

    it('does not create prompts for an already connected pair', async () => {
        await connectProfiles(profileA, profileB, false);

        expect(await createPrompts('credential:connected')).toEqual({});
    });

    it('reports an old prompt as stale after a later claim reopens the direction', async () => {
        const first = await createPrompts('credential:claim-1');
        await skipConnectionPrompt(profileB, first.claimerPrompt!.promptId);

        const later = await createPrompts('credential:claim-2');

        expect(later.claimerPrompt?.promptId).not.toBe(first.claimerPrompt?.promptId);
        await expect(
            getConnectionPromptStatus(profileB, first.claimerPrompt!.promptId)
        ).resolves.toEqual({
            promptId: first.claimerPrompt!.promptId,
            status: 'STALE',
        });
    });

    it('allows only one terminal action to win a connect and skip race', async () => {
        const created = await createPrompts('credential:claim-1');
        const promptId = created.claimerPrompt!.promptId;

        const results = await Promise.all([
            connectWithConnectionPrompt(profileB, promptId),
            skipConnectionPrompt(profileB, promptId),
        ]);

        expect(new Set(results.map(result => result.status))).toHaveLength(1);
        expect(['CONNECTED', 'SKIPPED']).toContain(results[0]!.status);
        await expect(getConnectionPromptStatus(profileB, promptId)).resolves.toEqual(results[0]);
    });

    it('connecting from a prompt resolves both directed prompts', async () => {
        const created = await createPrompts('credential:claim-1');

        await expect(
            connectWithConnectionPrompt(profileB, created.claimerPrompt!.promptId)
        ).resolves.toEqual({
            promptId: created.claimerPrompt!.promptId,
            status: 'CONNECTED',
        });

        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
        await expect(
            getConnectionPromptStatus(profileA, created.senderPrompt!.promptId)
        ).resolves.toEqual({
            promptId: created.senderPrompt!.promptId,
            status: 'CONNECTED',
        });
    });

    it('ordinary connection acceptance resolves both directed prompts permanently', async () => {
        const created = await createPrompts('credential:claim-1');

        await requestConnection(profileA, profileB);
        await connectProfiles(profileB, profileA);

        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
        expect(
            await getConnectionPromptStatus(profileA, created.senderPrompt!.promptId)
        ).toMatchObject({ status: 'CONNECTED' });
        expect(
            await getConnectionPromptStatus(profileB, created.claimerPrompt!.promptId)
        ).toMatchObject({ status: 'CONNECTED' });

        await disconnectProfiles(profileA, profileB);

        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
    });

    it('blocking skips both directed prompts and unblocking does not resurface them', async () => {
        const created = await createPrompts('credential:claim-1');

        await blockProfile(profileA, profileB);

        expect(
            await getConnectionPromptStatus(profileA, created.senderPrompt!.promptId)
        ).toMatchObject({ status: 'SKIPPED' });
        expect(
            await getConnectionPromptStatus(profileB, created.claimerPrompt!.promptId)
        ).toMatchObject({ status: 'SKIPPED' });

        await unblockProfile(profileA, profileB);

        expect(await getPendingConnectionPrompts(profileA)).toHaveLength(0);
        expect(await getPendingConnectionPrompts(profileB)).toHaveLength(0);
    });

    it('requires a new claim after disconnect or unblock to create another prompt instance', async () => {
        const connected = await createPrompts('credential:claim-1');
        await connectWithConnectionPrompt(profileB, connected.claimerPrompt!.promptId);
        await disconnectProfiles(profileA, profileB);

        const afterDisconnect = await createPrompts('credential:claim-2');
        expect(afterDisconnect.claimerPrompt?.promptId).not.toBe(connected.claimerPrompt?.promptId);

        await blockProfile(profileA, profileB);
        await unblockProfile(profileA, profileB);

        const afterUnblock = await createPrompts('credential:claim-3');
        expect(afterUnblock.claimerPrompt?.promptId).not.toBe(
            afterDisconnect.claimerPrompt?.promptId
        );
    });
});
