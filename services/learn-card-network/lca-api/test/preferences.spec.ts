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

            const updateResult = await updatePreferences(did, { theme: newTheme });
            expect(updateResult).toBe(true);

            const result = await getPreferencesForDid(did);
            expect(result).not.toBeNull();
            expect(result?.theme).toEqual(newTheme);
        });

        it('should upsert preferences for a non-existent DID', async () => {
            // updatePreferences now uses upsert: true, so it creates a document if none exists
            const updateResult = await updatePreferences(nonExistentDid, {
                theme: ThemeEnum.Formal,
            });
            expect(updateResult).toBe(true);

            const result = await getPreferencesForDid(nonExistentDid);
            expect(result).not.toBeNull();
            expect(result?.theme).toEqual(ThemeEnum.Formal);
        });
    });

    describe('Privacy Preference Fields', () => {
        it('should store and retrieve all privacy fields for a minor', async () => {
            await createTestPreferences(ThemeEnum.Colorful);

            const updateResult = await updatePreferences(did, {
                aiEnabled: false,
                aiAutoDisabled: true,
                analyticsEnabled: false,
                analyticsAutoDisabled: true,
                bugReportsEnabled: false,
                isMinor: true,
            });
            expect(updateResult).toBe(true);

            const result = await getPreferencesForDid(did);
            expect(result).not.toBeNull();
            expect(result?.aiEnabled).toBe(false);
            expect(result?.aiAutoDisabled).toBe(true);
            expect(result?.analyticsEnabled).toBe(false);
            expect(result?.analyticsAutoDisabled).toBe(true);
            expect(result?.bugReportsEnabled).toBe(false);
            expect(result?.isMinor).toBe(true);
            // Theme should be unchanged
            expect(result?.theme).toEqual(ThemeEnum.Colorful);
        });

        it('should store and retrieve all privacy fields for an adult', async () => {
            await createTestPreferences(ThemeEnum.Colorful);

            const updateResult = await updatePreferences(did, {
                aiEnabled: true,
                aiAutoDisabled: false,
                analyticsEnabled: true,
                analyticsAutoDisabled: false,
                bugReportsEnabled: true,
                isMinor: false,
            });
            expect(updateResult).toBe(true);

            const result = await getPreferencesForDid(did);
            expect(result).not.toBeNull();
            expect(result?.aiEnabled).toBe(true);
            expect(result?.aiAutoDisabled).toBe(false);
            expect(result?.analyticsEnabled).toBe(true);
            expect(result?.analyticsAutoDisabled).toBe(false);
            expect(result?.bugReportsEnabled).toBe(true);
            expect(result?.isMinor).toBe(false);
        });

        it('should allow partial updates without clearing other fields', async () => {
            await createTestPreferences(ThemeEnum.Colorful);

            // Set all fields initially
            await updatePreferences(did, {
                aiEnabled: false,
                aiAutoDisabled: true,
                analyticsEnabled: false,
                analyticsAutoDisabled: true,
                bugReportsEnabled: false,
                isMinor: true,
            });

            // Partially update only aiEnabled (e.g., adult toggling AI on in settings)
            await updatePreferences(did, { aiEnabled: true });

            const result = await getPreferencesForDid(did);
            expect(result).not.toBeNull();
            expect(result?.aiEnabled).toBe(true);
            // Other fields should remain unchanged
            expect(result?.aiAutoDisabled).toBe(true);
            expect(result?.analyticsEnabled).toBe(false);
            expect(result?.analyticsAutoDisabled).toBe(true);
            expect(result?.bugReportsEnabled).toBe(false);
            expect(result?.isMinor).toBe(true);
            expect(result?.theme).toEqual(ThemeEnum.Colorful);
        });

        it('should upsert privacy fields for a new DID without prior preferences', async () => {
            const newDid = 'new-user-did-privacy';

            const updateResult = await updatePreferences(newDid, {
                aiEnabled: false,
                aiAutoDisabled: true,
                analyticsEnabled: false,
                analyticsAutoDisabled: true,
                bugReportsEnabled: false,
                isMinor: true,
            });
            expect(updateResult).toBe(true);

            const result = await getPreferencesForDid(newDid);
            expect(result).not.toBeNull();
            expect(result?.aiEnabled).toBe(false);
            expect(result?.isMinor).toBe(true);
        });

        it('should return undefined for privacy fields when not set', async () => {
            await createTestPreferences(ThemeEnum.Colorful);

            const result = await getPreferencesForDid(did);
            expect(result).not.toBeNull();
            expect(result?.theme).toEqual(ThemeEnum.Colorful);
            // Privacy fields should be undefined when never set
            expect(result?.aiEnabled).toBeUndefined();
            expect(result?.aiAutoDisabled).toBeUndefined();
            expect(result?.analyticsEnabled).toBeUndefined();
            expect(result?.analyticsAutoDisabled).toBeUndefined();
            expect(result?.bugReportsEnabled).toBeUndefined();
            expect(result?.isMinor).toBeUndefined();
        });

        it('should return privacy fields via tRPC getPreferencesForDid route', async () => {
            await createTestPreferences(ThemeEnum.Colorful);
            await updatePreferences(did, {
                aiEnabled: false,
                bugReportsEnabled: true,
                isMinor: true,
            });

            const result = await userA.clients.fullAuth.preferences.getPreferencesForDid();
            expect(result.theme).toEqual(ThemeEnum.Colorful);
            expect(result.aiEnabled).toBe(false);
            expect(result.bugReportsEnabled).toBe(true);
            expect(result.isMinor).toBe(true);
            // Unset fields should be undefined
            expect(result.analyticsEnabled).toBeUndefined();
        });

        it('should not invent a theme when no saved preferences exist', async () => {
            const result = await userA.clients.fullAuth.preferences.getPreferencesForDid();

            expect(result.theme).toBeUndefined();
            expect(result.aiEnabled).toBeUndefined();
            expect(result.analyticsEnabled).toBeUndefined();
            expect(result.bugReportsEnabled).toBeUndefined();
            expect(result.isMinor).toBeUndefined();
        });

        it('should update privacy fields via tRPC updatePreferences route', async () => {
            await createTestPreferences(ThemeEnum.Colorful);

            await userA.clients.fullAuth.preferences.updatePreferences({
                aiEnabled: true,
                analyticsEnabled: false,
                bugReportsEnabled: true,
                isMinor: false,
            });

            const result = await getPreferencesForDid(did);
            expect(result).not.toBeNull();
            expect(result?.aiEnabled).toBe(true);
            expect(result?.analyticsEnabled).toBe(false);
            expect(result?.bugReportsEnabled).toBe(true);
            expect(result?.isMinor).toBe(false);
        });
    });
});
