import type { Db, Filter, ObjectId } from 'mongodb';
import { z } from 'zod';

import type { MongoRuntime } from './mongo';
import {
    createFieldAad,
    isEncryptedEnvelope,
    type EncryptedJsonEnvelopeV1,
    type EncryptionService,
} from './security/encryption';

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
    getEncryption?: () => EncryptionService;
}

export const DEFAULT_LEARNCARD_ASSISTANT_PROFILE = {
    name: 'My Assistant',
    personality: 'Encouraging, practical, and focused on helping you grow your career.',
    avatarVariant: 'robot',
} as const;

type StoredLearnCardAssistantProfile = Omit<LearnCardAssistantProfile, 'name' | 'personality'> & {
    name: string | EncryptedJsonEnvelopeV1;
    personality: string | EncryptedJsonEnvelopeV1;
};

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
    db: Db,
    encryption: EncryptionService
): LearnCardAssistantProfileRepository => {
    const collection = db.collection<StoredLearnCardAssistantProfile>(
        LEARNCARD_ASSISTANT_PROFILE_COLLECTION
    );
    let indexesReady: Promise<void> | undefined;
    let migrationReady: Promise<void> | undefined;

    const aad = (profile: Pick<LearnCardAssistantProfile, 'ownerDid'>, fieldPath: string): string =>
        createFieldAad({
            collectionName: LEARNCARD_ASSISTANT_PROFILE_COLLECTION,
            ownerDid: profile.ownerDid,
            stableRecordId: profile.ownerDid,
            fieldPath,
        });

    const encryptProfile = async (
        profile: LearnCardAssistantProfile
    ): Promise<StoredLearnCardAssistantProfile> => ({
        ...profile,
        name: await encryption.encryptJson(profile.name, aad(profile, 'name')),
        personality: await encryption.encryptJson(profile.personality, aad(profile, 'personality')),
    });

    const decryptProfile = async (
        profile: StoredLearnCardAssistantProfile
    ): Promise<{ profile: LearnCardAssistantProfile; legacyPlaintext: boolean }> => {
        const name = await encryption.decryptLegacyOrEnvelope<string>(
            profile.name,
            aad(profile, 'name')
        );
        const personality = await encryption.decryptLegacyOrEnvelope<string>(
            profile.personality,
            aad(profile, 'personality')
        );

        return {
            profile: {
                ...profile,
                name: name.value,
                personality: personality.value,
            },
            legacyPlaintext: name.legacyPlaintext || personality.legacyPlaintext,
        };
    };

    const migrateExisting = async (): Promise<void> => {
        const profiles = await collection.find({}).toArray();

        await Promise.all(
            profiles
                .filter(
                    profile =>
                        !isEncryptedEnvelope(profile.name) ||
                        !isEncryptedEnvelope(profile.personality)
                )
                .map(async profile => {
                    const decrypted = await decryptProfile(profile);
                    await collection.replaceOne(
                        { ownerDid: profile.ownerDid } as Filter<StoredLearnCardAssistantProfile>,
                        await encryptProfile(decrypted.profile),
                        { upsert: false }
                    );
                })
        );
    };

    const ensureIndexes = async (): Promise<void> => {
        indexesReady ??= collection
            .createIndex({ ownerDid: 1 }, { unique: true })
            .then(() => undefined);

        await indexesReady;

        migrationReady ??= migrateExisting();

        await migrationReady;
    };

    return {
        findByOwnerDid: async ownerDid => {
            await ensureIndexes();

            const stored =
                (await collection.findOne({
                    ownerDid,
                } as Filter<StoredLearnCardAssistantProfile>)) ?? undefined;

            return stored ? (await decryptProfile(stored)).profile : undefined;
        },
        upsert: async profile => {
            await ensureIndexes();
            await collection.replaceOne(
                { ownerDid: profile.ownerDid } as Filter<StoredLearnCardAssistantProfile>,
                await encryptProfile(profile),
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
    db: Db,
    encryption: EncryptionService
): LearnCardAssistantProfileService =>
    createLearnCardAssistantProfileService(
        createMongoLearnCardAssistantProfileRepository(db, encryption)
    );

export const createLearnCardAssistantProfileRuntime = ({
    mongoRuntime,
    service,
    getEncryption,
}: LearnCardAssistantProfileRuntimeOptions): LearnCardAssistantProfileRuntime => {
    let servicePromise: Promise<LearnCardAssistantProfileService | undefined> | undefined;

    const getService = async (): Promise<LearnCardAssistantProfileService | undefined> => {
        if (service) return service;

        servicePromise ??= (async () => {
            const status = await mongoRuntime.getStatus();
            if (!status.connected) {
                if (!status.configured) return undefined;
                throw new Error('LearnCard Assistant profile storage is not available.');
            }
            if (!getEncryption) {
                throw new Error('Encrypted LearnCard Assistant profile storage is not configured.');
            }

            return createMongoLearnCardAssistantProfileService(
                await mongoRuntime.getDb(),
                getEncryption()
            );
        })();

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
