import { Preferences } from '@accesslayer/preferences';
import { getUser } from './helpers/getClient';

import { getPreferencesForDid } from '@accesslayer/preferences/read';
import { updatePreferences } from '@accesslayer/preferences/update';

import { ThemeEnum } from '../src/types/preferences';

import { client } from '@mongo';

let userA: Awaited<ReturnType<typeof getUser>>;

beforeAll(async () => {
    try {
        await client.connect();
    } catch (error) {
        console.error(error);
    }
});

afterAll(async () => {
    try {
        await client.close();
    } catch (error) {
        console.error(error);
    }
});

describe('Preferences', () => {
    let did: string;

    beforeAll(async () => {
        userA = await getUser();
    });

    beforeEach(async () => {
        await Preferences.deleteMany({});
        did = userA.learnCard.id.did();
    });

    const createTestPreferences = async (theme: ThemeEnum) => {
        await expect(
            userA.clients.fullAuth.preferences.createPreferences({
                theme,
            })
        ).resolves.not.toThrow();
    };

    describe('create Preferences', () => {
        it('should allow you to create preferences', async () => {
            await createTestPreferences(ThemeEnum.Colorful);
        });

        it('should prevent you from creating preferences, if one already exists', async () => {
            await createTestPreferences(ThemeEnum.Colorful);

            await expect(
                userA.clients.fullAuth.preferences.createPreferences({
                    theme: ThemeEnum.Colorful,
                })
            ).rejects.toThrow('An unexpected error occured, unable to create preferences');
        });
    });

    describe('Get Preferences', () => {
        const nonExistentDid = 'non-existent-did';

        it('should get preferences for an existing DID', async () => {
            await createTestPreferences(ThemeEnum.Colorful);
            const result = await getPreferencesForDid(did);

            expect(result).not.toBeNull();
            expect(result?.theme).toEqual(ThemeEnum.Colorful);
        });

        it('should return null for non-existing DID', async () => {
            const result = await getPreferencesForDid(nonExistentDid);
            expect(result).toBeNull();
        });
    });

    describe('Update Preferences', () => {
        const nonExistentDid = 'non-existent-did';

        it('should update preferences for an existing DID', async () => {
            await createTestPreferences(ThemeEnum.Colorful);
            const newTheme = ThemeEnum.Formal;

            const updateResult = await updatePreferences(did, newTheme);
            expect(updateResult).toBe(true);

            const result = await getPreferencesForDid(did);
            expect(result).not.toBeNull();
            expect(result?.theme).toEqual(newTheme);
        });

        it('should throw an error when updating non-existent preferences', async () => {
            await expect(updatePreferences(nonExistentDid, ThemeEnum.Formal)).rejects.toThrow(
                'An unexpected error occured, unable to update preferences'
            );
        });
    });
});
