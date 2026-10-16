import { z } from 'zod';
import {
    SignupFailure,
    signupDraftSchema,
    signupEligibility,
    signupPreferences,
    validateSignup,
    type SignupDraft,
} from './signup-policy';

type Profile = {
    profileId: string;
    displayName?: string;
    dob?: string;
    country?: string;
    approved?: boolean;
};
export interface SignupWallet {
    invoke: {
        getProfile: () => Promise<Profile | null | undefined>;
        getProfileById: (id: string) => Promise<Profile | null | undefined>;
        createProfile: (input: Record<string, unknown>) => Promise<string>;
        sendGuardianApprovalEmail: (input: { guardianEmail: string }) => Promise<unknown>;
    };
}
export type SignupJournal = {
    version: 1;
    started: number;
    fresh: boolean;
    draft?: SignupDraft;
    preferencesSaved?: boolean;
    recoveryAttempted?: boolean;
    recoveryConfirmed?: boolean;
    guardianSent?: boolean;
};
export interface SignupDependencies {
    journal: {
        read: () => Promise<SignupJournal | undefined>;
        write: (journal: SignupJournal) => Promise<void>;
        clear: () => Promise<void>;
    };
    phase: () => string;
    prepareIdentity: () => Promise<void>;
    wallet: () => Promise<SignupWallet>;
    savePreferences: (input: ReturnType<typeof signupPreferences>) => Promise<void>;
    prepareBackup: (password: string) => Promise<string>;
    confirmBackup: (contents: string, password: string) => Promise<void>;
    token: () => Promise<string>;
    state: () => Promise<unknown>;
    active: () => boolean;
}
export const readSignupJournal = (raw: string | null): SignupJournal | undefined => {
    if (!raw) return;
    const schema = z
        .object({
            version: z.literal(1),
            started: z.number().positive(),
            fresh: z.boolean(),
            draft: signupDraftSchema.optional(),
            preferencesSaved: z.boolean().optional(),
            recoveryAttempted: z.boolean().optional(),
            recoveryConfirmed: z.boolean().optional(),
            guardianSent: z.boolean().optional(),
        })
        .strict();
    try {
        const parsed = schema.safeParse(JSON.parse(raw));
        if (
            parsed.success &&
            parsed.data.started <= Date.now() &&
            Date.now() - parsed.data.started < 7 * 86400_000
        )
            return parsed.data;
    } catch {
        /* Invalid or expired progress never grants new-account eligibility. */
    }
};

/** Every mutation is serialized, reconciled against ownership and scoped to the active host. */
export const createSignupCommands = (deps: SignupDependencies) => {
    let running = false;
    let pendingBackup: { id: string; contents: string } | undefined;
    const assertActive = () => {
        if (!deps.active()) throw new SignupFailure('unavailable');
    };
    const exclusive = async <T>(operation: () => Promise<T>) => {
        assertActive();
        if (running) throw new SignupFailure('unavailable');
        running = true;
        try {
            return await operation();
        } finally {
            running = false;
        }
    };
    const prepare = async (input: unknown) => {
        const draft = validateSignup(input);
        if (!['needs_setup', 'missing_profile', 'finish_setup'].includes(deps.phase()))
            throw new SignupFailure('unavailable');
        let journal = await deps.journal.read();
        assertActive();
        await deps.prepareIdentity();
        assertActive();
        const wallet = await deps.wallet(),
            profile = await wallet.invoke.getProfile();
        assertActive();
        if (
            profile &&
            (profile.profileId !== draft.profileId ||
                profile.dob !== draft.dob ||
                profile.country !== draft.country)
        )
            throw new SignupFailure('changed');
        if (!profile) {
            const existing = await wallet.invoke.getProfileById(draft.profileId);
            assertActive();
            if (existing) throw new SignupFailure('taken');
        }
        journal = journal ?? {
            version: 1,
            started: Date.now(),
            fresh: deps.phase() === 'needs_setup',
        };
        if (journal.draft && JSON.stringify(journal.draft) !== JSON.stringify(draft))
            journal.preferencesSaved = false;
        journal.draft = draft;
        await deps.journal.write(journal);
        assertActive();
        if (!journal.preferencesSaved) {
            try {
                await deps.savePreferences(signupPreferences(draft));
            } catch {
                throw new SignupFailure('privacy');
            }
            assertActive();
            journal.preferencesSaved = true;
            await deps.journal.write(journal);
        }
        return { draft, journal, wallet, profile };
    };
    const finish = async (input: unknown) => {
        const { draft, journal, wallet, profile: previous } = await prepare(input);
        if (!journal.recoveryConfirmed) throw new SignupFailure('recovery');
        let profile = previous;
        if (!profile) {
            const token = await deps.token();
            assertActive();
            const guardian = signupEligibility(draft.dob, draft.country).guardianRequired;
            try {
                await wallet.invoke.createProfile({
                    profileId: draft.profileId,
                    displayName: draft.name,
                    image: draft.image ?? '',
                    shortBio: '',
                    bio: '',
                    dob: draft.dob,
                    country: draft.country,
                    ...(guardian ? { approved: false } : {}),
                    authToken: token,
                });
            } catch {
                // Lost acknowledgement: read this identity's profile before considering another mutation.
                profile = await wallet.invoke.getProfile();
                assertActive();
                if (!profile) {
                    const conflict = await wallet.invoke.getProfileById(draft.profileId);
                    assertActive();
                    if (conflict) throw new SignupFailure('taken');
                }
                if (
                    !profile ||
                    profile.profileId !== draft.profileId ||
                    profile.dob !== draft.dob ||
                    profile.country !== draft.country
                )
                    throw new SignupFailure('connection');
            }
            assertActive();
            profile = await wallet.invoke.getProfile();
            assertActive();
            if (!profile || profile.profileId !== draft.profileId)
                throw new SignupFailure('connection');
        }
        if (profile.approved === false && !journal.guardianSent) {
            try {
                await wallet.invoke.sendGuardianApprovalEmail({
                    guardianEmail: draft.guardianEmail!,
                });
                assertActive();
                journal.guardianSent = true;
                await deps.journal.write(journal);
            } catch {
                /* Remain pending with an explicit resend action; delivery is never approval. */
            }
        }
        return deps.state();
    };
    return {
        signupPrepare: async (input: unknown) =>
            exclusive(async () => {
                const parsed = z
                    .object({
                        dob: z.string(),
                        country: z.string(),
                        guardianEmail: z.string().optional(),
                        teenAcknowledged: z.boolean(),
                    })
                    .strict()
                    .safeParse(input);
                if (
                    !parsed.success ||
                    !['needs_setup', 'missing_profile', 'finish_setup'].includes(deps.phase())
                )
                    throw new SignupFailure('invalid');
                const policy = signupEligibility(parsed.data.dob, parsed.data.country);
                if (policy.underage) throw new SignupFailure('underage');
                if (
                    (policy.teenNotice && !parsed.data.teenAcknowledged) ||
                    (policy.guardianRequired &&
                        !z.string().email().safeParse(parsed.data.guardianEmail?.trim()).success)
                )
                    throw new SignupFailure('invalid');
                await deps.prepareIdentity();
                assertActive();
                return deps.state();
            }),
        signupAvailability: async (input: unknown) => {
            assertActive();
            if (!['missing_profile', 'finish_setup'].includes(deps.phase()))
                throw new SignupFailure('unavailable');
            const parsed = z
                .object({
                    profileId: z
                        .string()
                        .min(3)
                        .max(25)
                        .regex(/^[a-z0-9-]+$/),
                })
                .strict()
                .safeParse(input);
            if (!parsed.success) throw new SignupFailure('invalid');
            const wallet = await deps.wallet(),
                existing = await wallet.invoke.getProfileById(parsed.data.profileId);
            assertActive();
            const mine = await wallet.invoke.getProfile();
            assertActive();
            return { available: !existing || existing.profileId === mine?.profileId };
        },
        signupBackup: async (input: unknown) =>
            exclusive(async () => {
                const parsed = z
                    .object({ draft: z.unknown(), password: z.string().min(12).max(256) })
                    .strict()
                    .safeParse(input);
                if (!parsed.success) throw new SignupFailure('invalid');
                const { journal } = await prepare(parsed.data.draft);
                if (journal.recoveryConfirmed) throw new SignupFailure('changed');
                journal.recoveryAttempted = true;
                await deps.journal.write(journal);
                assertActive();
                // Only encrypted file contents leave the SDK host. Never persist this password.
                const contents = await deps.prepareBackup(parsed.data.password);
                assertActive();
                pendingBackup = { id: crypto.randomUUID(), contents };
                return { ...pendingBackup, filename: 'LearnCard-Recovery.json' };
            }),
        signupConfirmBackup: async (input: unknown) =>
            exclusive(async () => {
                const parsed = z
                    .object({ id: z.string().uuid(), password: z.string().min(12).max(256) })
                    .strict()
                    .safeParse(input);
                if (!parsed.success || !pendingBackup || parsed.data.id !== pendingBackup.id)
                    throw new SignupFailure('recovery');
                const journal = await deps.journal.read();
                assertActive();
                if (!journal?.draft) throw new SignupFailure('changed');
                if (!journal.recoveryConfirmed) {
                    await deps.confirmBackup(pendingBackup.contents, parsed.data.password);
                    assertActive();
                    journal.recoveryConfirmed = true;
                    await deps.journal.write(journal);
                }
                const result = await finish(journal.draft);
                pendingBackup = undefined;
                return result;
            }),
        signupComplete: async (input: unknown) =>
            exclusive(async () => {
                const parsed = z.object({ draft: z.unknown() }).strict().safeParse(input);
                if (!parsed.success) throw new SignupFailure('invalid');
                return finish(parsed.data.draft);
            }),
        signupApproval: async (input: unknown) =>
            exclusive(async () => {
                const parsed = z
                    .object({ guardianEmail: z.string().email().max(254) })
                    .strict()
                    .safeParse(input);
                if (!parsed.success || deps.phase() !== 'pending_approval')
                    throw new SignupFailure('invalid');
                const wallet = await deps.wallet(),
                    profile = await wallet.invoke.getProfile();
                assertActive();
                if (profile?.approved !== false) return deps.state();
                await wallet.invoke.sendGuardianApprovalEmail({
                    guardianEmail: parsed.data.guardianEmail.trim().toLowerCase(),
                });
                assertActive();
                const journal = await deps.journal.read();
                if (journal) {
                    journal.guardianSent = true;
                    await deps.journal.write(journal);
                }
                return deps.state();
            }),
        signupStatus: async () => {
            assertActive();
            return deps.state();
        },
    };
};
