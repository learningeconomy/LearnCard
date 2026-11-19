import type admin from 'firebase-admin';

import { environment } from '@environment';
import app from '@firebase';

/** The Firebase Admin calls the sign-in email helpers use. */
export type AdminAuth = Pick<
    admin.auth.Auth,
    'getUser' | 'getUserByEmail' | 'updateUser' | 'createUser' | 'deleteUser' | 'createCustomToken'
>;

type FakeUser = {
    uid: string;
    email?: string;
    emailVerified: boolean;
    phoneNumber?: string;
    providerData: admin.auth.UserInfo[];
};

const authError = (code: string): Error & { code: string } =>
    Object.assign(new Error(code), { code });

const toRecord = (user: FakeUser): admin.auth.UserRecord =>
    ({ ...user, disabled: false, metadata: {} }) as unknown as admin.auth.UserRecord;

/**
 * In-memory Firebase Admin users for `IS_E2E_TEST`, where no Admin credentials exist. An
 * unknown uid reads as an existing user with no email or phone (`lazyUsers`), because E2E
 * sign-in tokens imply users Firebase never created. Custom tokens are
 * `e2e-custom-token-<uid>`, like `keys.upgradeContactMethod`'s E2E bypass.
 */
export const createInMemoryAdminAuth = () => {
    const users = new Map<string, FakeUser>();
    const state = { lazyUsers: true };
    const byEmail = (email: string) =>
        [...users.values()].find(user => user.email === email.trim().toLowerCase());
    const auth: AdminAuth = {
        getUser: async uid => {
            let user = users.get(uid);
            if (!user && state.lazyUsers) {
                user = { uid, emailVerified: false, providerData: [] };
                users.set(uid, user);
            }
            if (!user) throw authError('auth/user-not-found');
            return toRecord(user);
        },
        getUserByEmail: async email => {
            const user = byEmail(email);
            if (!user) throw authError('auth/user-not-found');
            return toRecord(user);
        },
        createUser: async request => {
            const uid = request.uid ?? `e2e-${users.size + 1}-${Date.now().toString(36)}`;
            if (users.has(uid)) throw authError('auth/uid-already-exists');
            if (request.email && byEmail(request.email))
                throw authError('auth/email-already-exists');
            const user: FakeUser = {
                uid,
                ...(request.email ? { email: request.email.trim().toLowerCase() } : {}),
                emailVerified: request.emailVerified ?? false,
                ...(request.phoneNumber ? { phoneNumber: request.phoneNumber } : {}),
                providerData: [],
            };
            users.set(uid, user);
            return toRecord(user);
        },
        updateUser: async (uid, request) => {
            const user = users.get(uid) ?? (state.lazyUsers ? undefined : null);
            if (user === null) throw authError('auth/user-not-found');
            const current = user ?? { uid, emailVerified: false, providerData: [] };
            if (request.email) {
                const holder = byEmail(request.email);
                if (holder && holder.uid !== uid) throw authError('auth/email-already-exists');
                current.email = request.email.trim().toLowerCase();
            }
            if (request.emailVerified !== undefined) current.emailVerified = request.emailVerified;
            if (request.phoneNumber === null) delete current.phoneNumber;
            else if (request.phoneNumber) current.phoneNumber = request.phoneNumber;
            users.set(uid, current);
            return toRecord(current);
        },
        deleteUser: async uid => {
            if (!users.delete(uid) && !state.lazyUsers) throw authError('auth/user-not-found');
        },
        createCustomToken: async uid => `e2e-custom-token-${uid}`,
    };
    return {
        auth,
        /** Seed or replace a user (tests). */
        setUser: (user: Partial<FakeUser> & { uid: string }) =>
            users.set(user.uid, {
                emailVerified: false,
                providerData: [],
                ...user,
                ...(user.email ? { email: user.email.toLowerCase() } : {}),
            }),
        peek: (uid: string): FakeUser | undefined => users.get(uid),
        reset: (options: { lazyUsers?: boolean } = {}) => {
            users.clear();
            state.lazyUsers = options.lazyUsers ?? true;
        },
    };
};

/** The process-wide E2E fake (see `createInMemoryAdminAuth`). */
export const e2eAdminAuth = createInMemoryAdminAuth();

/**
 * Firebase Admin auth for the sign-in email helpers: the in-memory fake under
 * `IS_E2E_TEST`, otherwise the configured Admin app (undefined without credentials).
 */
export const getAdminAuth = (): AdminAuth | undefined =>
    environment.IS_E2E_TEST ? e2eAdminAuth.auth : app?.auth();
