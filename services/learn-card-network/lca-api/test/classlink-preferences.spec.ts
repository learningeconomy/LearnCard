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
vi.mock('../src/helpers/classlink.config', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/helpers/classlink.config')>()),
    getClassLinkConfig: vi.fn(),
}));
// Spy on the real lookup (real UserKey + ClassLinkIdentity documents) to count calls.
vi.mock('../src/helpers/classlinkContext.helpers', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/helpers/classlinkContext.helpers')>();
    return { ...actual, getClassLinkStudentStatus: vi.fn(actual.getClassLinkStudentStatus) };
});

import mongodb from '@mongo';
import cache from '@cache';
import { preferencesRouter } from '../src/routes/preferences';
import {
    upsertClassLinkIdentity,
    getClassLinkIdentitiesCollection,
} from '../src/models/ClassLinkIdentity';
import { Preferences } from '../src/accesslayer/preferences';
import {
    getNotStudentCacheKey,
    NOT_STUDENT_CACHE_TTL_SECS,
} from '../src/accesslayer/preferences/privacyLock';
import { createMinorPreferencesIfAbsent, enforceMinorPreferences } from '../src/models/Preferences';
import { getClassLinkConfig } from '../src/helpers/classlink.config';
import { getClassLinkStudentStatus } from '../src/helpers/classlinkContext.helpers';
import { ThemeEnum } from '../src/types/preferences';
import type { ClassLinkConfig } from '../src/types/classlink';

const student = 'did:key:classlink-student';
const adult = 'did:key:regular-adult';
const classLinkAdult = 'did:key:classlink-teacher';
const caller = (did: string) => preferencesRouter.createCaller({ user: { did } } as never);

const minor = {
    aiEnabled: false,
    aiAutoDisabled: true,
    analyticsEnabled: false,
    analyticsAutoDisabled: true,
    bugReportsEnabled: false,
    bugReportsAutoDisabled: true,
    isMinor: true,
};

const config = {
    clientId: 'client',
    clientSecret: 'secret',
    tenants: {},
} as unknown as ClassLinkConfig;
const studentLookups = vi.mocked(getClassLinkStudentStatus);

const identity = (firebaseUid: string, sub: string, isMinorHint: boolean) => ({
    identityKey: `classlink:tenant-test:${sub}`,
    tenantId: 'tenant-test',
    sub,
    role: isMinorHint ? 'Student' : 'Teacher',
    email: `${sub}@example.edu`,
    sealedStateStudentId: null,
    state: '',
    firebaseUid,
    subject: `subject-${sub}`,
    lastAuthTime: new Date(),
    isMinorHint,
});

beforeEach(async () => {
    lookup.fail = false;
    vi.mocked(getClassLinkConfig).mockReturnValue(config);
    await cache.delete([student, adult, classLinkAdult].map(getNotStudentCacheKey));
    await mongodb.collection('userkeys').deleteMany({});
    await getClassLinkIdentitiesCollection().deleteMany({});
    await Preferences.deleteMany({});
    await mongodb.collection('userkeys').insertMany([
        { primaryDid: student, authProviders: [{ type: 'firebase', id: 'uid-student' }] },
        { primaryDid: adult, authProviders: [{ type: 'firebase', id: 'uid-adult' }] },
        { primaryDid: classLinkAdult, authProviders: [{ type: 'firebase', id: 'uid-teacher' }] },
    ]);
    await upsertClassLinkIdentity(identity('uid-student', 'student-1', true));
    await upsertClassLinkIdentity(identity('uid-teacher', 'teacher-1', false));
    studentLookups.mockClear();
});

describe('ClassLink student privacy lock', () => {
    it('creates locked minor settings for a ClassLink student', async () => {
        await caller(student).createPreferences({ theme: ThemeEnum.Colorful });

        expect(await Preferences.findOne({ did: student })).toMatchObject({
            ...minor,
            privacyLock: { source: 'classlink', lockedAt: expect.any(Date) },
        });
        expect(await caller(student).getPreferencesForDid()).toMatchObject({
            ...minor,
            locked: true,
        });
    });

    it('keeps AI, analytics and bug reports off when a student tries to enable them', async () => {
        await caller(student).createPreferences({ theme: ThemeEnum.Colorful });
        await caller(student).updatePreferences({
            aiEnabled: true,
            aiAutoDisabled: false,
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

    it('locks and repairs a student record saved before the rule applied, on first read only', async () => {
        await Preferences.insertOne({
            did: student,
            theme: ThemeEnum.Colorful,
            aiEnabled: true,
            analyticsEnabled: true,
            bugReportsEnabled: true,
            isMinor: false,
        });

        expect(await caller(student).getPreferencesForDid()).toMatchObject(minor);
        expect(await Preferences.findOne({ did: student })).toMatchObject({
            ...minor,
            privacyLock: { source: 'classlink' },
        });
        expect(studentLookups).toHaveBeenCalledTimes(1);

        await caller(student).getPreferencesForDid();
        await caller(student).updatePreferences({ aiEnabled: true });
        expect(studentLookups).toHaveBeenCalledTimes(1);
    });

    it('enforces a stored lock without any lookup, even when the lookup would fail', async () => {
        await enforceMinorPreferences(student);
        lookup.fail = true;

        await caller(student).updatePreferences({ aiEnabled: true, isMinor: false });
        expect(await caller(student).getPreferencesForDid()).toMatchObject({
            ...minor,
            locked: true,
        });
        expect(await Preferences.findOne({ did: student })).toMatchObject(minor);
        expect(studentLookups).not.toHaveBeenCalled();
    });

    it('enforces a stored lock even when ClassLink is no longer configured', async () => {
        await enforceMinorPreferences(student, 'district-policy');
        vi.mocked(getClassLinkConfig).mockReturnValue(null);

        await caller(student).updatePreferences({ aiEnabled: true });
        expect(await caller(student).getPreferencesForDid()).toMatchObject({
            ...minor,
            locked: true,
        });
        expect(await Preferences.findOne({ did: student })).toMatchObject({
            privacyLock: { source: 'district-policy' },
        });
    });

    it('keeps the original lock source and time when enforced again', async () => {
        await enforceMinorPreferences(student, 'first');
        const first = await Preferences.findOne({ did: student });
        await enforceMinorPreferences(student, 'second');

        expect((await Preferences.findOne({ did: student }))?.privacyLock).toEqual(
            first?.privacyLock
        );
    });

    it('locks minor defaults created on transcript arrival', async () => {
        await createMinorPreferencesIfAbsent(student);
        lookup.fail = true;

        await caller(student).updatePreferences({ aiEnabled: true });
        expect(await caller(student).getPreferencesForDid()).toMatchObject({
            ...minor,
            locked: true,
        });
        expect(studentLookups).not.toHaveBeenCalled();
    });

    it('never locks an adult, with or without a ClassLink identity', async () => {
        for (const did of [adult, classLinkAdult]) {
            await caller(did).createPreferences({ theme: ThemeEnum.Colorful });
            await caller(did).updatePreferences({ aiEnabled: true, isMinor: false });
            const result = await caller(did).getPreferencesForDid();

            expect(result).toMatchObject({ aiEnabled: true, isMinor: false });
            expect(result.locked).toBeUndefined();
            expect((await Preferences.findOne({ did }))?.privacyLock).toBeUndefined();
        }
    });

    it('caches a "not a student" answer so repeat calls skip the lookup', async () => {
        await caller(adult).createPreferences({ theme: ThemeEnum.Colorful });
        await caller(adult).updatePreferences({ aiEnabled: true });
        await caller(adult).getPreferencesForDid();

        expect(studentLookups).toHaveBeenCalledTimes(1);
        const ttl = await cache.ttl(getNotStudentCacheKey(adult));
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(NOT_STUDENT_CACHE_TTL_SECS);
    });

    it('does not cache a student or a failed lookup', async () => {
        await caller(student).getPreferencesForDid();
        lookup.fail = true;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await caller(adult).getPreferencesForDid();
        warn.mockRestore();

        expect(await cache.get(getNotStudentCacheKey(student))).toBeNull();
        expect(await cache.get(getNotStudentCacheKey(adult))).toBeNull();
    });

    it.each(['missing', 'invalid'])(
        'still locks a student with no stored lock when ClassLink config is %s',
        async () => {
            // getClassLinkConfig returns null both when credentials are unset and when
            // CLASSLINK_TENANTS fails to parse; neither may unlock an existing student.
            vi.mocked(getClassLinkConfig).mockReturnValue(null);
            expect(await Preferences.findOne({ did: student })).toBeNull();

            await caller(student).updatePreferences({
                aiEnabled: true,
                analyticsEnabled: true,
                isMinor: false,
            });
            expect(await Preferences.findOne({ did: student })).toMatchObject({
                ...minor,
                privacyLock: { source: 'classlink' },
            });
            expect(await caller(student).getPreferencesForDid()).toMatchObject({
                ...minor,
                locked: true,
            });
        }
    );

    it('never caches "not a student" for a DID whose account does not exist yet', async () => {
        const fresh = 'did:key:new-classlink-student';
        await cache.delete([getNotStudentCacheKey(fresh)]);
        // Onboarding reads preferences before wallet key storage creates the UserKey.
        const before = await caller(fresh).getPreferencesForDid();
        expect(before.locked).toBeUndefined();
        expect(await cache.get(getNotStudentCacheKey(fresh))).toBeNull();

        await mongodb.collection('userkeys').insertOne({
            primaryDid: fresh,
            authProviders: [{ type: 'firebase', id: 'uid-new-student' }],
        });
        await upsertClassLinkIdentity(identity('uid-new-student', 'student-new', true));

        await caller(fresh).updatePreferences({ aiEnabled: true, analyticsEnabled: true });
        expect(await Preferences.findOne({ did: fresh })).toMatchObject({
            ...minor,
            privacyLock: { source: 'classlink' },
        });
    });

    it('fails safe when the student lookup fails and no lock is stored', async () => {
        await caller(adult).createPreferences({ theme: ThemeEnum.Colorful });
        await caller(adult).updatePreferences({ aiEnabled: true, isMinor: false });
        await cache.delete([getNotStudentCacheKey(adult)]);
        lookup.fail = true;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        await expect(caller(adult).updatePreferences({ aiEnabled: false })).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
        });
        await expect(
            caller(student).createPreferences({ theme: ThemeEnum.Formal })
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
        expect(await caller(adult).getPreferencesForDid()).toMatchObject({
            ...minor,
            locked: true,
        });

        // Nothing was written: the adult keeps their settings and gains no lock.
        const saved = await Preferences.findOne({ did: adult });
        expect(saved).toMatchObject({ aiEnabled: true, isMinor: false });
        expect(saved?.privacyLock).toBeUndefined();
        expect(await Preferences.findOne({ did: student })).toBeNull();
        expect(warn).toHaveBeenCalledWith('classlink.student_lookup.failed');
        warn.mockRestore();
    });
});
