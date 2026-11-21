import { randomBytes, randomUUID } from 'node:crypto';

import type { AuthorizationCodeRecord, HcpOAuthClient, PendingAuthorization } from './types';

const CODE_TTL_MS = 10 * 60 * 1000;
const PENDING_TTL_MS = 15 * 60 * 1000;

/** Ephemeral AS state (clients, pending auth, codes). Not the HCP grant store. */
export type HcpOAuthSessionStore = {
    saveClient(client: HcpOAuthClient): Promise<void>;
    getClient(clientId: string): Promise<HcpOAuthClient | null>;
    savePending(pending: PendingAuthorization): Promise<void>;
    takePending(requestId: string): Promise<PendingAuthorization | null>;
    getPending(requestId: string): Promise<PendingAuthorization | null>;
    saveCode(record: AuthorizationCodeRecord): Promise<void>;
    takeCode(code: string): Promise<AuthorizationCodeRecord | null>;
};

export const createMemoryOAuthSessionStore = (): HcpOAuthSessionStore => {
    const clients = new Map<string, HcpOAuthClient>();
    const pending = new Map<string, PendingAuthorization>();
    const codes = new Map<string, AuthorizationCodeRecord>();

    const purgePending = (now: number) => {
        for (const [id, value] of pending) {
            if (value.createdAt + PENDING_TTL_MS <= now) pending.delete(id);
        }
    };

    const purgeCodes = (now: number) => {
        for (const [id, value] of codes) {
            if (value.expiresAt <= now) codes.delete(id);
        }
    };

    return {
        async saveClient(client) {
            clients.set(client.client_id, client);
        },
        async getClient(clientId) {
            return clients.get(clientId) ?? null;
        },
        async savePending(record) {
            purgePending(Date.now());
            pending.set(record.requestId, record);
        },
        async getPending(requestId) {
            purgePending(Date.now());
            const record = pending.get(requestId);
            if (!record) return null;
            if (record.createdAt + PENDING_TTL_MS <= Date.now()) {
                pending.delete(requestId);
                return null;
            }
            return record;
        },
        async takePending(requestId) {
            const record = await this.getPending(requestId);
            if (record) pending.delete(requestId);
            return record;
        },
        async saveCode(record) {
            purgeCodes(Date.now());
            codes.set(record.code, record);
        },
        async takeCode(code) {
            purgeCodes(Date.now());
            const record = codes.get(code) ?? null;
            if (record) codes.delete(code);
            if (record && record.expiresAt <= Date.now()) return null;
            return record;
        },
    };
};

export const newClientId = (): string => `hcp_oauth_${randomBytes(12).toString('hex')}`;
export const newRequestId = (): string => randomUUID();
export const newAuthorizationCode = (): string => randomBytes(24).toString('base64url');

export { CODE_TTL_MS };
