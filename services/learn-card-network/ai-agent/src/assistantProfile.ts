import type { Db, Filter, ObjectId } from 'mongodb';
import { z } from 'zod';

import type { MongoRuntime } from './mongo';

export const LEARNCARD_ASSISTANT_PROFILE_COLLECTION = 'learnCardAssistantProfiles';

export interface LearnCardAssistantProfile {
    _id?: ObjectId;
    ownerDid: string;
    name: string;
    personality: string;
    avatarVariant: 'robot';
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateLearnCardAssistantProfileInput {
    ownerDid: string;
    name?: string;
    personality?: string;
}

export interface LearnCardAssistantProfileResponse
    extends Omit<LearnCardAssistantProfile, '_id' | 'createdAt' | 'updatedAt'> {
    createdAt: string;
    updatedAt: string;
}

export interface LearnCardAssistantProfileRepository {
    findByOwnerDid: (ownerDid: string) => Promise<LearnCardAssistantProfile | undefined>;
    upsert: (profile: LearnCardAssistantProfile) => Promise<void>;
}

export interface LearnCardAssistantProfileService {
    getProfile: (ownerDid: string) => Promise<LearnCardAssistantProfile>;
    updateProfile: (
        input: UpdateLearnCardAssistantProfileInput
    ) => Promise<LearnCardAssistantProfile>;
}

export interface LearnCardAssistantProfileRuntime {
    getProfile(ownerDid: string): Promise<LearnCardAssistantProfile>;
    updateProfile(input: UpdateLearnCardAssistantProfileInput): Promise<LearnCardAssistantProfile>;
    getPrompt(ownerDid?: string): Promise<string | undefined>;
    getStatus(): Promise<{ configured: boolean; connected: boolean }>;
}

export interface LearnCardAssistantProfileRuntimeOptions {
    mongoRuntime: MongoRuntime;
    service?: LearnCardAssistantProfileService;
}

export const DEFAULT_LEARNCARD_ASSISTANT_PROFILE = {
    name: 'My Assistant',
    personality: 'Encouraging, practical, and focused on helping you grow your career.',
    avatarVariant: 'robot',
} as const;

export const UpdateLearnCardAssistantProfileValidator = z
    .object({
        ownerDid: z.string().trim().min(1),
        name: z.string().trim().min(1).max(60).optional(),
        personality: z.string().trim().min(1).max(180).optional(),
    })
    .strict();

const cloneProfile = (profile: LearnCardAssistantProfile): LearnCardAssistantProfile => ({
    ...profile,
    createdAt: new Date(profile.createdAt),
    updatedAt: new Date(profile.updatedAt),
});

const createDefaultProfile = (ownerDid: string): LearnCardAssistantProfile => {
    const now = new Date();

    return {
        ownerDid,
        ...DEFAULT_LEARNCARD_ASSISTANT_PROFILE,
        createdAt: now,
        updatedAt: now,
    };
};

export const toLearnCardAssistantProfileResponse = (
    profile: LearnCardAssistantProfile
): LearnCardAssistantProfileResponse => ({
    ownerDid: profile.ownerDid,
    name: profile.name,
    personality: profile.personality,
    avatarVariant: profile.avatarVariant,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
});

export const createMongoLearnCardAssistantProfileRepository = (
    db: Db
): LearnCardAssistantProfileRepository => {
    const collection = db.collection<LearnCardAssistantProfile>(
        LEARNCARD_ASSISTANT_PROFILE_COLLECTION
    );
    let indexesReady: Promise<void> | undefined;

    const ensureIndexes = async (): Promise<void> => {
        indexesReady ??= collection
            .createIndex({ ownerDid: 1 }, { unique: true })
            .then(() => undefined);

        await indexesReady;
    };

    return {
        findByOwnerDid: async ownerDid => {
            await ensureIndexes();

            return (
                (await collection.findOne({ ownerDid } as Filter<LearnCardAssistantProfile>)) ??
                undefined
            );
        },
        upsert: async profile => {
            await ensureIndexes();
            await collection.replaceOne(
                { ownerDid: profile.ownerDid } as Filter<LearnCardAssistantProfile>,
                profile,
                { upsert: true }
            );
        },
    };
};

export const createInMemoryLearnCardAssistantProfileRepository = (
    initialProfiles: LearnCardAssistantProfile[] = []
): LearnCardAssistantProfileRepository => {
    const profiles = new Map<string, LearnCardAssistantProfile>();

    for (const profile of initialProfiles) profiles.set(profile.ownerDid, cloneProfile(profile));

    return {
        findByOwnerDid: async ownerDid => {
            const profile = profiles.get(ownerDid);

            return profile ? cloneProfile(profile) : undefined;
        },
        upsert: async profile => {
            profiles.set(profile.ownerDid, cloneProfile(profile));
        },
    };
};

export const createLearnCardAssistantProfileService = (
    repository: LearnCardAssistantProfileRepository
): LearnCardAssistantProfileService => ({
    getProfile: async ownerDid => {
        const trimmedOwnerDid = ownerDid.trim();
        const existing = await repository.findByOwnerDid(trimmedOwnerDid);

        return existing ? cloneProfile(existing) : createDefaultProfile(trimmedOwnerDid);
    },
    updateProfile: async input => {
        const parsed = UpdateLearnCardAssistantProfileValidator.parse(input);
        const existing = await repository.findByOwnerDid(parsed.ownerDid);
        const now = new Date();
        const profile: LearnCardAssistantProfile = {
            ...(existing ?? createDefaultProfile(parsed.ownerDid)),
            ...(parsed.name ? { name: parsed.name } : {}),
            ...(parsed.personality ? { personality: parsed.personality } : {}),
            updatedAt: now,
        };

        await repository.upsert(profile);

        return cloneProfile(profile);
    },
});

export const createMongoLearnCardAssistantProfileService = (
    db: Db
): LearnCardAssistantProfileService =>
    createLearnCardAssistantProfileService(createMongoLearnCardAssistantProfileRepository(db));

export const createLearnCardAssistantProfileRuntime = ({
    mongoRuntime,
    service,
}: LearnCardAssistantProfileRuntimeOptions): LearnCardAssistantProfileRuntime => {
    let servicePromise: Promise<LearnCardAssistantProfileService | undefined> | undefined;

    const getService = async (): Promise<LearnCardAssistantProfileService | undefined> => {
        if (service) return service;

        servicePromise ??= (async () => {
            const status = await mongoRuntime.getStatus();
            if (!status.connected) return undefined;

            return createMongoLearnCardAssistantProfileService(await mongoRuntime.getDb());
        })().catch(() => {
            servicePromise = undefined;

            return undefined;
        });

        return servicePromise;
    };

    return {
        getProfile: async ownerDid => {
            const trimmedOwnerDid = ownerDid.trim();
            const service = await getService();

            return service?.getProfile(trimmedOwnerDid) ?? createDefaultProfile(trimmedOwnerDid);
        },
        updateProfile: async input => {
            const service = await getService();
            if (!service) throw new Error('LearnCard Assistant profile storage is not available.');

            return service.updateProfile(input);
        },
        getPrompt: async ownerDid => {
            const trimmedOwnerDid = ownerDid?.trim();
            if (!trimmedOwnerDid) return undefined;

            const service = await getService();
            if (!service) return undefined;

            const profile = await service.getProfile(trimmedOwnerDid);

            return [
                'LearnCard Assistant profile:',
                `Name: ${profile.name}`,
                `Personality: ${profile.personality}`,
                'Speak consistently with this profile while staying concise and useful.',
            ].join('\n');
        },
        getStatus: async () => {
            if (service) return { configured: true, connected: true };

            const status = await mongoRuntime.getStatus();

            return {
                configured: status.configured,
                connected: status.connected,
            };
        },
    };
};
