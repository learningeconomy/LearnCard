import { beforeEach, describe, expect, it, vi } from 'vitest';

const lookup = vi.hoisted(() => ({ fail: false }));
vi.mock('../src/models/UserKey', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/models/UserKey')>();
    return {
        ...actual,
        findUserKeyByDid: async (did: string) => {
            if (lookup.fail) throw new Error('lookup unavailable');
            return actual.findUserKeyByDid(did);
        },
    };
});
vi.mock('@routes', async () => {
    const { initTRPC } = await import('@trpc/server');
    const t = initTRPC.create();
    return { t, openRoute: t.procedure, didAndChallengeRoute: t.procedure };
});

import mongodb from '@mongo';
import { preferencesRouter } from '../src/routes/preferences';
import {
    upsertClassLinkIdentity,
    getClassLinkIdentitiesCollection,
} from '../src/models/ClassLinkIdentity';
import { Preferences } from '../src/accesslayer/preferences';
import { ThemeEnum } from '../src/types/preferences';

const student = 'did:key:classlink-student';
const adult = 'did:key:regular-adult';
const caller = (did: string) => preferencesRouter.createCaller({ user: { did } } as never);

const minor = {
    aiEnabled: false,
    analyticsEnabled: false,
    bugReportsEnabled: false,
    bugReportsAutoDisabled: true,
    isMinor: true,
};

beforeEach(async () => {
    lookup.fail = false;
    await mongodb.collection('userkeys').deleteMany({});
    await getClassLinkIdentitiesCollection().deleteMany({});
    await Preferences.deleteMany({});
    await mongodb.collection('userkeys').insertMany([
        { primaryDid: student, authProviders: [{ type: 'firebase', id: 'uid-student' }] },
        { primaryDid: adult, authProviders: [{ type: 'firebase', id: 'uid-adult' }] },
    ]);
    await upsertClassLinkIdentity({
        identityKey: 'classlink:tenant-test:student-1',
        tenantId: 'tenant-test',
        sourcedId: 'student-1',
        sub: 'sub-1',
        role: 'Student',
        email: 'student@example.edu',
        sealedStateStudentId: null,
        state: '',
        firebaseUid: 'uid-student',
        subject: 'subject-1',
        lastAuthTime: new Date(),
        isMinorHint: true,
    });
});

describe('ClassLink student privacy settings', () => {
    it('creates minor settings for a ClassLink student', async () => {
        await caller(student).createPreferences({ theme: ThemeEnum.Colorful });
        expect(await caller(student).getPreferencesForDid()).toMatchObject(minor);
    });

    it('keeps AI, analytics and bug reports off when a student tries to enable them', async () => {
        await caller(student).createPreferences({ theme: ThemeEnum.Colorful });
        await caller(student).updatePreferences({
            aiEnabled: true,
            analyticsEnabled: true,
            bugReportsEnabled: true,
            isMinor: false,
            theme: ThemeEnum.Formal,
        });
        expect(await caller(student).getPreferencesForDid()).toMatchObject({
            ...minor,
            theme: ThemeEnum.Formal,
        });
    });

    it('repairs adult settings saved before the rule applied', async () => {
        await Preferences.insertOne({
            did: student,
            theme: ThemeEnum.Colorful,
            aiEnabled: true,
            analyticsEnabled: true,
            bugReportsEnabled: true,
            isMinor: false,
        });
        expect(await caller(student).getPreferencesForDid()).toMatchObject(minor);
    });

    it('leaves non-ClassLink accounts unchanged', async () => {
        await caller(adult).createPreferences({ theme: ThemeEnum.Colorful });
        await caller(adult).updatePreferences({ aiEnabled: true, isMinor: false });
        expect(await caller(adult).getPreferencesForDid()).toMatchObject({
            aiEnabled: true,
            isMinor: false,
        });
    });

    it('fails safe when the student lookup fails', async () => {
        await caller(adult).createPreferences({ theme: ThemeEnum.Colorful });
        await caller(adult).updatePreferences({ aiEnabled: true, isMinor: false });
        await caller(student).createPreferences({ theme: ThemeEnum.Colorful });
        lookup.fail = true;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await expect(
            caller(student).updatePreferences({ aiEnabled: true, isMinor: false })
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
        await expect(
            caller(adult).createPreferences({ theme: ThemeEnum.Formal })
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
        expect(await caller(student).getPreferencesForDid()).toMatchObject(minor);
        expect(await caller(adult).getPreferencesForDid()).toMatchObject(minor);

        expect(await Preferences.findOne({ did: adult })).toMatchObject({
            aiEnabled: true,
            isMinor: false,
        });
        expect(await Preferences.findOne({ did: student })).toMatchObject(minor);
        expect(warn).toHaveBeenCalledWith('classlink.student_lookup.failed');
        warn.mockRestore();
    });
});
