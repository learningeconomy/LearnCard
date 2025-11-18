import { z } from 'zod';
import {
    JWE,
    DidDocument,
    JWKWithPrivateKey,
    VP,
    LCNNotificationTypeEnumValidator,
    LCNNotificationValidator,
    LCNProfile,
} from '@learncard/types';
import { Plugin } from '@learncard/core';
import { ProofOptions } from '@learncard/didkit-plugin';

export type BoostSkills = {
    category: string;
    skill: string;
    subskills: string[];
};

export const ScoutsSSOResponseSchema = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    'not-before-policy': z.number(),
    refresh_expires_in: z.number(),
    refresh_token: z.string(),
    scope: z.string(),
    session_state: z.string(),
    token_type: z.string(),
    error: z.string().optional(),
    error_description: z.string().optional(),
});
export type ScoutSSOResponseType = z.infer<typeof ScoutsSSOResponseSchema>;

const UserRecordSchema = z.object({
    uid: z.string(),
    email: z.string().nullable(),
    emailVerified: z.boolean(),
    displayName: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    photoURL: z.string().nullable(),
    disabled: z.boolean(),
    providerData: z.array(
        z.object({
            uid: z.string(),
            displayName: z.string().nullable(),
            email: z.string().nullable(),
            phoneNumber: z.string().nullable(),
            photoURL: z.string().nullable(),
            providerId: z.string(),
        })
    ),
    metadata: z.object({
        creationTime: z.string(),
        lastSignInTime: z.string().nullable(),
    }),
    customClaims: z.record(z.any()).optional(),
});

export type UserRecordType = z.infer<typeof UserRecordSchema>;

// Zod Schema for Firebase Custom Token Response
const FirebaseCustomAuthResponseSchema = z.object({
    firebaseToken: z.string(),
});

export type FirebaseCustomAuthResponse = z.infer<typeof FirebaseCustomAuthResponseSchema>;

// Zod Schema for Preferences
export enum ThemeEnum {
    Colorful = 'colorful',
    Formal = 'formal',
}

export const PreferencesValidator = z.object({
    theme: z.enum([ThemeEnum.Colorful, ThemeEnum.Formal]),
});

export type PreferencesType = z.infer<typeof PreferencesValidator>;

/** @group LCA API Plugin */
export const SigningAuthorityValidator = z.object({
    _id: z.string().optional(),
    ownerDid: z.string(),
    name: z.string(),
    did: z.string().optional(),
    endpoint: z.string().optional(),
});

/** @group LCA API Plugin */
export type SigningAuthorityType = z.infer<typeof SigningAuthorityValidator>;

/** @group LCA API Plugin */
export type SigningAuthorityAuthorization = {
    type: string;
    boostUri: string;
};

/** These Types are Kept in Sync with LCA-API Service.
 * TODO: Move into shared package
 */

/** @group LCA API Plugin */
export const NotificationActionStatusEnumValidator = z.enum(['PENDING', 'COMPLETED', 'REJECTED']);

export type NotificationActionStatusEnumType = z.infer<
    typeof NotificationActionStatusEnumValidator
>;

/** @group LCA API Plugin */
export const NotificationMetaValidator = z.object({
    archived: z.boolean().optional(),
    read: z.boolean().optional(),
    actionStatus: NotificationActionStatusEnumValidator.optional(),
});

/** @group LCA API Plugin */
export type NotificationMetaType = z.infer<typeof NotificationMetaValidator>;

/** @group LCA API Plugin */
export const NotificationQueryFiltersValidator = NotificationMetaValidator.extend({
    type: LCNNotificationTypeEnumValidator.optional(),
});

/** @group LCA API Plugin */
export type NotificationQueryFiltersType = z.infer<typeof NotificationQueryFiltersValidator>;

// Paginated Notifications
/** @group LCA API Plugin */
export const NotificationsSortEnumValidator = z.enum(['CHRONOLOGICAL', 'REVERSE_CHRONOLOGICAL']);

/** @group LCA API Plugin */
export type NotificationsSortEnum = z.infer<typeof NotificationsSortEnumValidator>;

/** @group LCA API Plugin */
export const PaginatedNotificationsOptionsValidator = z.object({
    limit: z.number(),
    cursor: z.string().optional(),
    sort: NotificationsSortEnumValidator.default(
        NotificationsSortEnumValidator.enum.REVERSE_CHRONOLOGICAL
    ),
});

/** @group LCA API Plugin */
export type PaginatedNotificationsOptionsType = z.infer<
    typeof PaginatedNotificationsOptionsValidator
>;

/** @group LCA API Plugin */
export const NotificationValidator = LCNNotificationValidator.extend({
    _id: z.string().optional(),
    read: z.boolean(),
    archived: z.boolean(),
    actionStatus: NotificationActionStatusEnumValidator.optional(),
});
/** @group LCA API Plugin */
export type NotificationType = z.infer<typeof NotificationValidator>;

export const PaginatedNotificationsValidator = z.object({
    cursor: z.string().optional(),
    hasMore: z.boolean(),
    notifications: NotificationValidator.array(),
});

export type PaginatedNotificationsType = z.infer<typeof PaginatedNotificationsValidator>;
/** END Synced Types**/

/** @group LCA API Plugin */
export type LCAPluginDependentMethods = {
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
    getProfile: () => Promise<LCNProfile | undefined>;
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => JWKWithPrivateKey;
    keyToDid: (type: 'key', keypair: JWKWithPrivateKey) => string;
    resolveDid: (did: string) => Promise<DidDocument>;
    addDidMetadata: (metadata: Partial<DidDocument>) => Promise<boolean>;
    decryptDagJwe: <T>(jwe: JWE, jwks?: JWKWithPrivateKey[]) => Promise<T>;
    crypto: () => Crypto;
};

export enum DASHBOARD_TYPE {
    NSO,
    GLOBAL,
    TROOP,
}

export type AnalyticsPayload = {
    resource: {
        dashboardType: DASHBOARD_TYPE;
    };
    params: {
        nso_id?: string[];
        troop_id?: string[];
    };
    exp: number;
};

/** @group LCA API Plugin */
export type LCAPluginMethods = {
    registerDeviceForPushNotifications: (token: string) => Promise<boolean>;
    unregisterDeviceForPushNotifications: (token: string) => Promise<boolean>;
    getNotifications: (
        options: PaginatedNotificationsOptionsType,
        filter?: NotificationQueryFiltersType
    ) => Promise<PaginatedNotificationsType | false>;
    updateNotificationMeta: (_id: string, meta: NotificationMetaType) => Promise<boolean>;
    markAllNotificationsRead: () => Promise<boolean>;
    createSigningAuthority: (name: string) => Promise<SigningAuthorityType | false>;
    getSigningAuthorities: () => Promise<SigningAuthorityType[] | false>;
    authorizeSigningAuthority: (
        name: string,
        authorization: SigningAuthorityAuthorization
    ) => Promise<boolean>;
    resetLCAClient: () => Promise<void>;
    generateBoostInfo: (description: string) => Promise<{
        title: string;
        description: string;
        category: string;
        type: string;
        skills: BoostSkills[];
        narrative: string;
    }>;
    generateImage: (prompt: string) => Promise<string>;
    generateBoostSkills: (description: string) => Promise<BoostSkills[]>;
    createPin: (pin: string) => Promise<boolean>;
    hasPin: (did?: string) => Promise<boolean>;
    verifyPin: (pin: string, did?: string) => Promise<boolean>;
    updatePin: (currentPin: string, newPin: string) => Promise<boolean>;
    generatePinUpdateToken: () => Promise<{ token: string; tokenExpire: Date } | null>;
    validatePinUpdateToken: (token: string) => Promise<boolean>;
    updatePinWithToken: (token: string, newPin: string) => Promise<boolean>;
    generateAnalyticsAccessToken: (payload: AnalyticsPayload) => Promise<string | null>;
    decryptDagJwe: <T>(jwe: JWE, jwks?: JWKWithPrivateKey[]) => Promise<T>;
    hash: (message: string, algorithm?: string) => Promise<string | undefined>;
    getFirebaseUserByEmail: (email: string) => Promise<UserRecordType | null>;
    authenticateWithKeycloak: (token: string) => Promise<FirebaseCustomAuthResponse>;
    authenticateWithScoutsSSO: (
        username: string,
        password: string
    ) => Promise<ScoutSSOResponseType | null>;
    sendLoginVerificationCode: (email: string) => Promise<{ success: boolean; message?: string }>;
    verifyLoginCode: (
        email: string,
        code: string
    ) => Promise<{ success: boolean; message?: string; token?: string }>;
    verifyNetworkHandoffToken: (token: string) => Promise<{ success: boolean; message?: string; token?: string }>;
    getProofOfLoginVp: (token: string) => Promise<{ success: boolean; error?: string; vp?: string }>;
    updatePreferences: (preferences: PreferencesType) => Promise<boolean>;
    createPreferences: (preferences: PreferencesType) => Promise<boolean>;
    getPreferencesForDid: () => Promise<PreferencesType>;
};

/** @group LearnCardNetwork Plugin */
export type LCAPlugin = Plugin<
    'LearnCard App',
    never,
    LCAPluginMethods,
    'id',
    LCAPluginDependentMethods
>;
