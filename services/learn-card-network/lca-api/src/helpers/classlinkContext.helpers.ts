import { TRPCError } from '@trpc/server';
import { findUserKeyByDid, type MongoUserKeyType } from '../models/UserKey';
import {
    clearStateStudentIdIfUnchanged,
    findClassLinkIdentityByFirebaseUid,
    type MongoClassLinkIdentityType,
} from '../models/ClassLinkIdentity';
import { hasExpiredStateStudentId } from '@helpers/classlinkPii.helpers';
import { getClassLinkConfig, getClassLinkTenant } from '@helpers/classlink.config';
import type { ClassLinkTenantConfig } from 'types/classlink';

export type ClassLinkStudentStatus = 'student' | 'not_student' | 'unknown';

/** Whether the DID belongs to a ClassLink student. Lookup failures return 'unknown'. */
export const getClassLinkStudentStatus = async (did: string): Promise<ClassLinkStudentStatus> => {
    try {
        const userKey = await findUserKeyByDid(did);
        for (const provider of userKey?.authProviders ?? []) {
            if (provider.type !== 'firebase') continue;
            const identity = await findClassLinkIdentityByFirebaseUid(provider.id);
            if (identity) return identity.isMinorHint === true ? 'student' : 'not_student';
        }
        return 'not_student';
    } catch {
        console.warn('classlink.student_lookup.failed');
        return 'unknown';
    }
};

/**
 * True when the DID belongs to a ClassLink student. Fails safe: a lookup error counts as a
 * student, so a failure can never unlock student privacy settings.
 */
export const isClassLinkStudentDid = async (did: string): Promise<boolean> =>
    (await getClassLinkStudentStatus(did)) !== 'not_student';

export interface ClassLinkContext {
    userKey: MongoUserKeyType;
    firebaseUid: string;
    identity: MongoClassLinkIdentityType;
    tenant: ClassLinkTenantConfig | undefined;
}

/** Resolve account ownership from the authenticated DID, never a client-supplied identity. */
export const resolveClassLinkContext = async (did: string): Promise<ClassLinkContext> => {
    const userKey = await findUserKeyByDid(did);
    if (!userKey) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Finish setting up your account first.',
        });
    }
    for (const provider of userKey.authProviders) {
        if (provider.type !== 'firebase') continue;
        const identity = await findClassLinkIdentityByFirebaseUid(provider.id);
        if (!identity) continue;
        if (hasExpiredStateStudentId(identity)) {
            // Readers already ignore expired IDs, so a failed clear is retried by cleanup.
            await clearStateStudentIdIfUnchanged(identity).catch(() =>
                console.warn('classlink.pii.clear_failed')
            );
        }
        const config = getClassLinkConfig();
        const tenant = config ? getClassLinkTenant(config, identity.tenantId) : undefined;
        return { userKey, firebaseUid: provider.id, identity, tenant };
    }
    throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Sign in with ClassLink to request your transcript.',
    });
};
