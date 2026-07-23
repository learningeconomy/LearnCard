import { describe, expect, it } from 'vitest';

import {
    createInMemoryLearnCardAssistantProfileRepository,
    createLearnCardAssistantProfileRuntime,
    createLearnCardAssistantProfileService,
} from '../src/assistantProfile';
import type { MongoRuntime } from '../src/mongo';

const unavailableMongoRuntime: MongoRuntime = {
    getClient: async () => {
        throw new Error('No Mongo.');
    },
    getDb: async () => {
        throw new Error('No Mongo.');
    },
    getStatus: async () => ({ configured: false, connected: false, dbName: 'test' }),
    close: async () => undefined,
};

const createService = () =>
    createLearnCardAssistantProfileService(createInMemoryLearnCardAssistantProfileRepository());

describe('LearnCard Assistant profile', () => {
    it('returns the default profile when none exists', async () => {
        const profile = await createService().getProfile('did:key:user');

        expect(profile).toMatchObject({
            ownerDid: 'did:key:user',
            name: 'My Assistant',
            personality: 'Encouraging, practical, and focused on helping you grow your career.',
            avatarVariant: 'robot',
        });
        expect(profile.createdAt).toBeInstanceOf(Date);
        expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it('validates updates', async () => {
        const service = createService();

        await expect(service.updateProfile({ ownerDid: '', name: 'Taylor' })).rejects.toThrow();
        await expect(
            service.updateProfile({ ownerDid: 'did:key:user', name: '' })
        ).rejects.toThrow();
        await expect(
            service.updateProfile({
                ownerDid: 'did:key:user',
                name: 'A'.repeat(61),
            })
        ).rejects.toThrow();
    });

    it('persists profile updates', async () => {
        const service = createService();

        await service.updateProfile({
            ownerDid: 'did:key:user',
            name: 'LearnCard Assistant',
            personality: 'Direct and practical.',
        });

        await expect(service.getProfile('did:key:user')).resolves.toMatchObject({
            ownerDid: 'did:key:user',
            name: 'LearnCard Assistant',
            personality: 'Direct and practical.',
            avatarVariant: 'robot',
        });
    });

    it('builds the profile prompt', async () => {
        const service = createService();
        const runtime = createLearnCardAssistantProfileRuntime({
            mongoRuntime: unavailableMongoRuntime,
            service,
        });

        await service.updateProfile({
            ownerDid: 'did:key:user',
            name: 'Coach',
            personality: 'Concise and encouraging.',
        });

        await expect(runtime.getPrompt('did:key:user')).resolves.toBe(
            [
                'LearnCard Assistant profile:',
                'Name: Coach',
                'Personality: Concise and encouraging.',
                'Speak consistently with this profile while staying concise and useful.',
            ].join('\n')
        );
    });

    it('returns defaults and no prompt when Mongo is unavailable', async () => {
        const runtime = createLearnCardAssistantProfileRuntime({
            mongoRuntime: unavailableMongoRuntime,
        });

        await expect(runtime.getProfile('did:key:user')).resolves.toMatchObject({
            ownerDid: 'did:key:user',
            name: 'My Assistant',
        });
        await expect(runtime.getPrompt('did:key:user')).resolves.toBeUndefined();
        await expect(
            runtime.updateProfile({ ownerDid: 'did:key:user', name: 'Coach' })
        ).rejects.toThrow('LearnCard Assistant profile storage is not available.');
    });
});
