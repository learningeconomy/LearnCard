import { TRPCError } from '@trpc/server';
import { findUserKeyByDid, type MongoUserKeyType } from '../models/UserKey';
import {
    findClassLinkIdentityByFirebaseUid,
    type MongoClassLinkIdentityType,
} from '../models/ClassLinkIdentity';
import { getClassLinkConfig, getClassLinkTenant } from '@helpers/classlink.config';
import type { ClassLinkTenantConfig } from 'types/classlink';

/**
 * True when the DID belongs to a ClassLink account flagged as a student. Lookup failures
 * return false so preferences keep working; the flag is set at ClassLink sign-in.
 */
export const isClassLinkStudentDid = async (did: string): Promise<boolean> => {
    try {
        const userKey = await findUserKeyByDid(did);
        for (const provider of userKey?.authProviders ?? []) {
            if (provider.type !== 'firebase') continue;
            const identity = await findClassLinkIdentityByFirebaseUid(provider.id);
            if (identity) return identity.isMinorHint === true;
        }
        return false;
    } catch {
        return false;
    }
};

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
        const config = getClassLinkConfig();
        const tenant = config ? getClassLinkTenant(config, identity.tenantId) : undefined;
        return { userKey, firebaseUid: provider.id, identity, tenant };
    }
    throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Sign in with ClassLink to request your transcript.',
    });
};
