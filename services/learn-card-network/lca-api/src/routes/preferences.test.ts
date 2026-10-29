import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initTRPC } from '@trpc/server';

const state = vi.hoisted(() => ({
    saved: {} as Record<string, unknown>,
    profile: { dob: '1990-01-01', country: 'US', type: 'personal' } as {
        dob?: string;
        country?: string;
        type?: string;
    },
    profileUnavailable: false,
}));
vi.mock('@routes', () => {
    const t = initTRPC.create();
    return { t, didAndChallengeRoute: t.procedure };
});
vi.mock('@accesslayer/preferences/create', () => ({
    createPreferences: async (_did: string, theme: string) => {
        state.saved = { theme };
        return true;
    },
}));
vi.mock('@accesslayer/preferences/read', () => ({
    getPreferencesForDid: async () => ({ ...state.saved }),
}));
vi.mock('@accesslayer/preferences/update', () => ({
    updatePreferences: async (_did: string, input: Record<string, unknown>) => {
        Object.assign(state.saved, input);
        return true;
    },
}));
vi.mock('@helpers/currentProfile', () => ({
    getCurrentProfile: async () => {
        if (state.profileUnavailable) throw new Error('Unable to resolve current profile');
        return { ...state.profile };
    },
}));
import { preferencesRouter } from './preferences';
import { ThemeEnum } from '../types/preferences';
const caller = preferencesRouter.createCaller({
    user: { did: 'did:example:person', isChallengeValid: true },
    tenant: { id: 'test-tenant' },
    authorizationHeader: 'Bearer signed-vp',
} as never);

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    state.saved = { theme: ThemeEnum.Colorful };
    state.profile = { dob: '1990-01-01', country: 'US', type: 'personal' };
    state.profileUnavailable = false;
});
afterEach(() => vi.useRealTimers());

describe('backend analytics age authorization', () => {
    it.each(['guardian', 'school', 'personal'])(
        'rejects forged age flags for an underage %s account',
        async type => {
            state.profile = { dob: '2012-01-01', country: 'US', type };
            await caller.updatePreferences({
                analyticsEnabled: true,
                isMinor: false,
                analyticsAutoDisabled: false,
            });
            expect(state.saved).toMatchObject({
                analyticsEnabled: false,
                isMinor: true,
                analyticsAutoDisabled: true,
            });
            expect(await caller.getPreferencesForDid()).toMatchObject({
                analyticsEnabled: false,
                isMinor: true,
            });
        }
    );

    it('permits adult opt-in but derives metadata instead of trusting caller flags', async () => {
        await caller.updatePreferences({
            analyticsEnabled: true,
            isMinor: true,
            analyticsAutoDisabled: true,
        });
        expect(state.saved).toMatchObject({
            analyticsEnabled: true,
            isMinor: false,
            analyticsAutoDisabled: false,
        });
        expect((await caller.getPreferencesForDid()).analyticsEnabled).toBe(true);
    });

    it('repairs incorrect saved consent and keeps it off after the profile becomes eligible', async () => {
        state.saved.analyticsEnabled = true;
        state.saved.isMinor = false;
        state.profile.dob = '2012-01-01';
        expect((await caller.getPreferencesForDid()).analyticsEnabled).toBe(false);
        expect(state.saved).toMatchObject({ analyticsEnabled: false, isMinor: true });
        state.profile.dob = '1990-01-01';
        expect(await caller.getPreferencesForDid()).toMatchObject({
            analyticsEnabled: false,
            isMinor: false,
        });
        expect(state.saved.analyticsEnabled).toBe(false);
    });

    it('re-evaluates trusted country and DOB on every direct API request', async () => {
        state.profile = { dob: '2010-10-29', country: 'FR' };
        await caller.updatePreferences({ analyticsEnabled: true });
        expect((await caller.getPreferencesForDid()).analyticsEnabled).toBe(true);
        state.profile.country = 'US';
        expect((await caller.getPreferencesForDid()).analyticsEnabled).toBe(false);
        expect(state.saved.analyticsEnabled).toBe(false);
        await caller.updatePreferences({ analyticsEnabled: true });
        expect(state.saved.analyticsEnabled).toBe(false);
        state.profile.dob = '2000-01-01';
        await caller.updatePreferences({ analyticsEnabled: true });
        expect((await caller.getPreferencesForDid()).analyticsEnabled).toBe(true);
    });

    it.each([
        [{ dob: undefined }, true],
        [{ dob: '' }, true],
        [{ dob: '1990-01-01', type: 'child' }, false],
        [{ dob: '2030-01-01' }, false],
        [{ dob: 'not-a-date' }, false],
    ])(
        'honors legacy absent DOB and fails closed for child/invalid/future profiles: %j',
        async (profile, allowed) => {
            state.profile = profile;
            await caller.updatePreferences({ analyticsEnabled: true });
            expect((await caller.getPreferencesForDid()).analyticsEnabled).toBe(allowed);
            expect(state.saved.analyticsEnabled).toBe(allowed);
        }
    );

    it('does not overwrite saved consent when trusted profile lookup fails', async () => {
        state.saved.analyticsEnabled = false;
        state.profileUnavailable = true;
        await expect(caller.updatePreferences({ analyticsEnabled: true })).rejects.toThrow(
            'Unable to resolve current profile'
        );
        await expect(caller.getPreferencesForDid()).rejects.toThrow(
            'Unable to resolve current profile'
        );
        await expect(caller.createPreferences({ theme: ThemeEnum.Formal })).rejects.toThrow(
            'Unable to resolve current profile'
        );
        expect(state.saved).toEqual({ theme: ThemeEnum.Colorful, analyticsEnabled: false });
    });
});
