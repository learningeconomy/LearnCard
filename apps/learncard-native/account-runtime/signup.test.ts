import { expect, test } from 'bun:test';
import {
    createSignupCommands,
    readSignupJournal,
    type SignupDependencies,
    type SignupJournal,
} from './signup';
import {
    SignupFailure,
    signupEligibility,
    signupPolicyData,
    validateSignup,
    type SignupDraft,
} from './signup-policy';
import { GDPR_AGE_LIMIT } from '../../../packages/learn-card-base/src/constants/gdprAgeLimits';
const draft = (changes: Partial<SignupDraft> = {}): SignupDraft => ({
    dob: '1995-01-01',
    country: 'US',
    name: 'Test Person',
    profileId: 'test-person',
    teenAcknowledged: false,
    termsAccepted: true,
    aiEnabled: false,
    analyticsEnabled: false,
    bugReportsEnabled: false,
    ...changes,
});
const password = 'only-synthetic-backup-password';
function fixture() {
    let phase = 'missing_profile',
        active = true,
        journal: SignupJournal | undefined;
    let profile:
        | {
              profileId: string;
              displayName?: string;
              dob?: string;
              country?: string;
              approved?: boolean;
          }
        | undefined;
    const events: string[] = [];
    let conflict = false,
        failPreferences = false,
        loseCreate = false,
        failEmail = false;
    const deps: SignupDependencies = {
        phase: () => phase,
        active: () => active,
        journal: {
            read: async () => journal && structuredClone(journal),
            write: async value => {
                journal = structuredClone(value);
            },
            clear: async () => {
                journal = undefined;
            },
        },
        prepareIdentity: async () => {
            events.push('identity');
        },
        wallet: async () => ({
            invoke: {
                getProfile: async () => profile,
                getProfileById: async id =>
                    conflict ? { profileId: id } : profile?.profileId === id ? profile : undefined,
                createProfile: async input => {
                    events.push('create');
                    profile = input as typeof profile;
                    if (loseCreate) throw new Error('ack lost');
                    return 'did:web:synthetic';
                },
                sendGuardianApprovalEmail: async () => {
                    events.push('email');
                    if (failEmail) throw new Error('synthetic failure');
                },
            },
        }),
        savePreferences: async input => {
            events.push('preferences');
            if (failPreferences) throw new Error('synthetic failure');
            if (input.isMinor) expect(input.aiEnabled).toBe(false);
        },
        prepareBackup: async value => {
            events.push('backup');
            expect(value).toBe(password);
            return JSON.stringify({
                version: 1,
                encryptedShare: { ciphertext: 'synthetic-encrypted-only' },
            });
        },
        confirmBackup: async (_contents, value) => {
            events.push('confirm');
            expect(value).toBe(password);
        },
        token: async () => 'synthetic-token',
        state: async () => {
            phase =
                profile?.approved === false
                    ? 'pending_approval'
                    : profile
                      ? 'ready'
                      : 'missing_profile';
            return { phase };
        },
    };
    return {
        commands: createSignupCommands(deps),
        deps,
        events,
        journal: () => journal,
        profile: () => profile,
        set: (values: {
            conflict?: boolean;
            failPreferences?: boolean;
            loseCreate?: boolean;
            failEmail?: boolean;
            phase?: string;
            active?: boolean;
            profile?: typeof profile;
        }) => {
            if (values.conflict !== undefined) conflict = values.conflict;
            if (values.failPreferences !== undefined) failPreferences = values.failPreferences;
            if (values.loseCreate !== undefined) loseCreate = values.loseCreate;
            if (values.failEmail !== undefined) failEmail = values.failEmail;
            if (values.phase) phase = values.phase;
            if (values.active !== undefined) active = values.active;
            if (values.profile !== undefined) profile = values.profile;
        },
    };
}
test('civil birthdays, leap days and future/invalid dates have explicit boundaries', () => {
    expect(signupEligibility('2013-10-17', 'US', '2026-10-16').underage).toBe(true);
    expect(signupEligibility('2013-10-16', 'US', '2026-10-16').age).toBe(13);
    expect(signupEligibility('2012-02-29', 'US', '2025-02-28').age).toBe(12);
    expect(signupEligibility('2012-02-29', 'US', '2025-03-01').age).toBe(13);
    for (const date of [
        '2026-10-17',
        '2023-02-29',
        '2000-02-30',
        '2000-13-01',
        '01/02/2000',
        '1899-01-01',
    ])
        expect(() => signupEligibility(date, 'US', '2026-10-16')).toThrow(SignupFailure);
    expect(() => signupEligibility('2000-01-01', 'ZZ')).toThrow();
});
test('shared Ireland maps agree with the corrected threshold; configured EU defaults and non-EU notice remain separate', () => {
    expect(GDPR_AGE_LIMIT.Ireland).toBe(16);
    expect(signupPolicyData.consentAges.IE).toBe(16);
    for (const country of signupPolicyData.eu) {
        const threshold =
            signupPolicyData.consentAges[country] ?? signupPolicyData.defaultConsentAge;
        expect(
            signupEligibility(`${2026 - threshold + 1}-01-01`, country, '2026-10-16')
                .guardianRequired
        ).toBe(threshold > 13);
        expect(
            signupEligibility(`${2026 - threshold}-01-01`, country, '2026-10-16').guardianRequired
        ).toBe(false);
    }
    expect(signupEligibility('2011-01-01', 'US', '2026-10-16')).toMatchObject({
        guardianRequired: false,
        teenNotice: true,
        isMinor: true,
    });
});
test('mutation validation rejects age/consent bypass, unknown fields and unsafe photo URLs', () => {
    const young = `${new Date().getFullYear() - 14}-01-01`;
    expect(() => validateSignup(draft({ dob: young, country: 'IE' }))).toThrow();
    expect(() => validateSignup(draft({ dob: young, country: 'US' }))).toThrow();
    expect(() => validateSignup({ ...draft(), approved: true })).toThrow();
    expect(() =>
        validateSignup(draft({ image: 'http://cdn.filestackcontent.com/image' }))
    ).toThrow();
    expect(
        validateSignup(
            draft({
                dob: young,
                country: 'IE',
                guardianEmail: 'PARENT@EXAMPLE.INVALID',
                aiEnabled: true,
                analyticsEnabled: true,
                bugReportsEnabled: true,
            })
        )
    ).toMatchObject({
        guardianEmail: 'parent@example.invalid',
        aiEnabled: false,
        analyticsEnabled: false,
        bugReportsEnabled: false,
    });
});
test('backup generation and cancelled export do not create a profile or persist the password', async () => {
    const f = fixture(),
        result = await f.commands.signupBackup({ draft: draft(), password });
    expect(f.events).toEqual(['identity', 'preferences', 'backup']);
    expect(f.profile()).toBeUndefined();
    expect(result.contents).toContain('encryptedShare');
    expect(result.contents).not.toContain(password);
    expect(JSON.stringify(f.journal())).not.toContain(password);
    await expect(f.commands.signupComplete({ draft: draft() })).rejects.toThrow('signup:recovery');
    expect(f.events.filter(x => x === 'create')).toHaveLength(0);
});
test('successful export confirmation precedes profile creation and saves exactly once', async () => {
    const f = fixture(),
        file = await f.commands.signupBackup({ draft: draft(), password });
    expect(await f.commands.signupConfirmBackup({ id: file.id, password })).toEqual({
        phase: 'ready',
    });
    expect(f.events).toEqual([
        'identity',
        'preferences',
        'backup',
        'confirm',
        'identity',
        'create',
    ]);
    expect(f.journal()?.recoveryConfirmed).toBe(true);
    expect(f.profile()?.profileId).toBe('test-person');
});
test('lost profile-create reply reconciles owned profile without duplicate creation', async () => {
    const f = fixture();
    f.set({ loseCreate: true });
    const file = await f.commands.signupBackup({ draft: draft(), password });
    expect(await f.commands.signupConfirmBackup({ id: file.id, password })).toEqual({
        phase: 'ready',
    });
    expect(f.events.filter(x => x === 'create')).toHaveLength(1);
});
test('failed preferences prevents backup/key export and profile creation; retry preserves identity', async () => {
    const f = fixture();
    f.set({ failPreferences: true });
    await expect(f.commands.signupBackup({ draft: draft(), password })).rejects.toThrow(
        'signup:privacy'
    );
    expect(f.events).toEqual(['identity', 'preferences']);
    f.set({ failPreferences: false });
    const file = await f.commands.signupBackup({ draft: draft(), password });
    await f.commands.signupConfirmBackup({ id: file.id, password });
    expect(f.events.filter(x => x === 'create')).toHaveLength(1);
});
test('handle conflicts remain editable and never overwrite another owned profile', async () => {
    const f = fixture();
    f.set({ conflict: true });
    await expect(f.commands.signupBackup({ draft: draft(), password })).rejects.toThrow(
        'signup:taken'
    );
    expect(f.events).not.toContain('preferences');
    f.set({ conflict: false });
    const next = draft({ profileId: 'another-name' });
    const file = await f.commands.signupBackup({ draft: next, password });
    await f.commands.signupConfirmBackup({ id: file.id, password });
    expect(f.profile()?.profileId).toBe('another-name');
    const other = fixture();
    other.set({ profile: { profileId: 'already-owned', dob: '1995-01-01', country: 'US' } });
    await expect(other.commands.signupBackup({ draft: draft(), password })).rejects.toThrow(
        'signup:changed'
    );
    expect(other.events).not.toContain('create');
});
test('parent email delivery failure keeps pending approval and resend does not approve', async () => {
    const f = fixture();
    f.set({ failEmail: true });
    const child = draft({
        dob: `${new Date().getFullYear() - 14}-01-01`,
        country: 'IE',
        guardianEmail: 'parent@example.invalid',
    });
    const file = await f.commands.signupBackup({ draft: child, password });
    expect(await f.commands.signupConfirmBackup({ id: file.id, password })).toEqual({
        phase: 'pending_approval',
    });
    expect(f.profile()?.approved).toBe(false);
    f.set({ failEmail: false });
    expect(await f.commands.signupApproval({ guardianEmail: 'parent@example.invalid' })).toEqual({
        phase: 'pending_approval',
    });
    expect(f.journal()?.guardianSent).toBe(true);
    expect(f.profile()?.approved).toBe(false);
});
test('new host cannot confirm a file generated before backgrounding; confirmed progress can resume safely', async () => {
    const f = fixture(),
        file = await f.commands.signupBackup({ draft: draft(), password });
    const resumed = createSignupCommands(f.deps);
    await expect(resumed.signupConfirmBackup({ id: file.id, password })).rejects.toThrow(
        'signup:recovery'
    );
    await f.commands.signupConfirmBackup({ id: file.id, password });
    expect(f.events.filter(x => x === 'backup')).toHaveLength(1);
});
test('expired or tampered journals cannot grant fresh-account eligibility', () => {
    expect(readSignupJournal('{bad')).toBeUndefined();
    expect(
        readSignupJournal(
            JSON.stringify({ version: 1, fresh: true, started: Date.now() - 8 * 86400_000 })
        )
    ).toBeUndefined();
    expect(
        readSignupJournal(
            JSON.stringify({ version: 1, fresh: true, started: Date.now(), privateKey: 'fake' })
        )
    ).toBeUndefined();
    expect(
        readSignupJournal(JSON.stringify({ version: 1, fresh: true, started: Date.now() }))
    ).toMatchObject({ fresh: true });
});
test('signed-out/inactive setup refuses all operations without transport or profile actions', async () => {
    const f = fixture();
    f.set({ active: false });
    await expect(f.commands.signupBackup({ draft: draft(), password })).rejects.toThrow(
        'signup:unavailable'
    );
    expect(f.events).toEqual([]);
});
test('concurrent enrollment is refused and a late encrypted artifact cannot escape a locked host', async () => {
    const f = fixture();
    let release!: (value: string) => void, entered!: () => void;
    const began = new Promise<void>(resolve => {
        entered = resolve;
    });
    f.deps.prepareBackup = () => {
        entered();
        return new Promise(resolve => {
            release = resolve;
        });
    };
    const operation = f.commands.signupBackup({ draft: draft(), password });
    await began;
    await expect(f.commands.signupBackup({ draft: draft(), password })).rejects.toThrow(
        'signup:unavailable'
    );
    f.set({ active: false });
    release('synthetic-encrypted-file');
    await expect(operation).rejects.toThrow('signup:unavailable');
    expect(f.profile()).toBeUndefined();
    expect(f.events).not.toContain('create');
});
test('protected fresh marker outlives the five-minute legacy heuristic but cannot authorize a changed journal schema', () => {
    const value = { version: 1, fresh: true, started: Date.now() - 10 * 60_000 };
    expect(readSignupJournal(JSON.stringify(value))?.fresh).toBe(true);
    expect(readSignupJournal(JSON.stringify({ ...value, version: 2 }))).toBeUndefined();
});
test('username lost after export confirmation can be changed without rotating a second backup', async () => {
    const f = fixture(),
        file = await f.commands.signupBackup({ draft: draft(), password });
    f.set({ conflict: true });
    await expect(f.commands.signupConfirmBackup({ id: file.id, password })).rejects.toThrow(
        'signup:taken'
    );
    expect(f.journal()?.recoveryConfirmed).toBe(true);
    expect(f.profile()).toBeUndefined();
    f.set({ conflict: false });
    await f.commands.signupComplete({ draft: draft({ profileId: 'new-available-name' }) });
    expect(f.profile()?.profileId).toBe('new-available-name');
    expect(f.events.filter(value => value === 'backup')).toHaveLength(1);
});
