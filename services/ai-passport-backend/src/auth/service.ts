import { randomBytes as nodeRandomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { initLearnCard } from '@learncard/init';

import type { VerificationCheck } from '@learncard/types';

import {
    AUTH_CHALLENGE_TTL_SECONDS,
    AUTH_SESSION_HANDOFF_TTL_SECONDS,
    AUTH_SESSION_TTL_SECONDS,
    AUTH_WEBSOCKET_TICKET_TTL_SECONDS,
    REDIS_PREFIX,
} from '../constants/env';
import { withOwnerOperation as runOwnerOperation } from '../services/dataErasure';
import type { RedisScriptStore } from '../utils/cache';
import cache from '../utils/cache';
import {
    consumeOwnerAuthenticationRecord,
    setOwnerAuthenticationRecord,
} from '../services/ownerAuthIndex';

export const AUTH_COOKIE_NAME = 'ai_passport_session';
export const getAuthLoginCookieName = (challenge: string): string =>
    `ai_passport_login_${challenge}`;

type ChallengeRecord = {
    did?: string;
    audience: string;
    binding: string;
    expiresAt: number;
    returnTo: string;
};

type SessionHandoffRecord = {
    did: string;
    expiresAt: number;
    origin: string;
    sessionId: string;
};

type SessionRecord = {
    authenticatedAt?: number;
    did: string;
};

type WebSocketTicketRecord = {
    did: string;
    expiresAt: number;
    origin: string;
    sessionId: string;
};

type AuthStore = RedisScriptStore & {
    del(key: string): Promise<unknown>;
    get(key: string): Promise<string | null>;
    getdel(key: string): Promise<string | null>;
    set(key: string, value: string, mode: 'EX', ttl: number): Promise<unknown>;
};

type VerifyPresentation = (
    presentation: string,
    options: {
        challenge: string;
        domain: string;
        proofFormat: 'jwt';
        proofPurpose: 'authentication';
    }
) => Promise<VerificationCheck>;

export type AuthErrorCode =
    | 'challenge_expired'
    | 'challenge_invalid'
    | 'challenge_replayed'
    | 'presentation_invalid'
    | 'session_handoff_expired'
    | 'session_handoff_invalid'
    | 'session_handoff_replayed'
    | 'websocket_ticket_expired'
    | 'websocket_ticket_invalid'
    | 'websocket_ticket_replayed';

export class AuthError extends Error {
    readonly code: AuthErrorCode;

    constructor(code: AuthErrorCode) {
        super(code);
        this.code = code;
        this.name = 'AuthError';
    }
}

const decodeJwtPayload = (presentation: string): Record<string, unknown> => {
    const segments = presentation.split('.');

    if (segments.length !== 3) throw new AuthError('presentation_invalid');

    try {
        const payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'));

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new AuthError('presentation_invalid');
        }

        return payload as Record<string, unknown>;
    } catch (error) {
        if (error instanceof AuthError) throw error;

        throw new AuthError('presentation_invalid');
    }
};

const getPresentationDid = (presentation: string): string => {
    const payload = decodeJwtPayload(presentation);
    const { vp } = payload;
    const holder =
        vp && typeof vp === 'object' && !Array.isArray(vp)
            ? (vp as Record<string, unknown>).holder
            : undefined;
    const issuer = payload.iss;

    if (
        typeof holder !== 'string' ||
        typeof issuer !== 'string' ||
        !holder.startsWith('did:') ||
        holder !== issuer
    ) {
        throw new AuthError('presentation_invalid');
    }

    return holder;
};

const parseRecord = <RecordType>(value: string): RecordType => {
    try {
        return JSON.parse(value) as RecordType;
    } catch {
        throw new AuthError('challenge_invalid');
    }
};

export const createAuthService = ({
    store,
    verifyPresentation,
    withOwnerOperation = runOwnerOperation,
    now = Date.now,
    randomBytes = nodeRandomBytes,
}: {
    store: AuthStore;
    verifyPresentation: VerifyPresentation;
    withOwnerOperation?: typeof runOwnerOperation;
    now?: () => number;
    randomBytes?: (size: number) => Buffer;
}) => {
    const consumeOwnerRecord = async (
        key: string,
        invalidCode: AuthErrorCode = 'challenge_invalid'
    ): Promise<string | null> => {
        const value = await store.get(key);
        if (!value) return null;
        let record: { did: string };
        try {
            record = JSON.parse(value) as { did: string };
            if (!record || typeof record.did !== 'string' || !record.did.startsWith('did:'))
                throw new Error('Invalid owner');
        } catch {
            throw new AuthError(invalidCode);
        }
        return withOwnerOperation(record.did, async () => {
            const consumed = await consumeOwnerAuthenticationRecord(store, record.did, key, value);
            return consumed ? value : null;
        });
    };
    const challengeKey = (challenge: string) => `${REDIS_PREFIX}:did-auth:challenge:${challenge}`;
    const sessionKey = (sessionId: string) => `${REDIS_PREFIX}:did-auth:session:${sessionId}`;
    const sessionHandoffKey = (handoff: string) =>
        `${REDIS_PREFIX}:did-auth:session-handoff:${handoff}`;

    const websocketTicketKey = (ticket: string) =>
        `${REDIS_PREFIX}:did-auth:websocket-ticket:${ticket}`;
    return {
        async createChallenge(input: {
            did?: string;
            audience: string;
            returnTo: string;
        }): Promise<{ binding: string; challenge: string; expiresAt: number }> {
            const challenge = randomBytes(32).toString('base64url');
            const expiresAt = now() + AUTH_CHALLENGE_TTL_SECONDS * 1000;
            const binding = randomBytes(32).toString('base64url');

            const value = JSON.stringify({
                audience: input.audience,
                returnTo: input.returnTo,
                ...(input.did ? { did: input.did } : {}),
                binding,
                expiresAt,
            } satisfies ChallengeRecord);
            if (input.did) {
                await withOwnerOperation(input.did, () =>
                    setOwnerAuthenticationRecord(
                        store,
                        input.did!,
                        challengeKey(challenge),
                        value,
                        AUTH_CHALLENGE_TTL_SECONDS
                    )
                );
            } else {
                await store.set(challengeKey(challenge), value, 'EX', AUTH_CHALLENGE_TTL_SECONDS);
            }

            return { binding, challenge, expiresAt };
        },

        async authenticate(input: {
            challenge: string;
            expectedReturnTo?: string;
            expectedBinding: string | undefined;
            presentation: string;
        }): Promise<{ did: string; returnTo: string; sessionId: string }> {
            const key = challengeKey(input.challenge);
            const storedChallenge = await store.get(key);

            if (!storedChallenge) throw new AuthError('challenge_invalid');

            const record = parseRecord<ChallengeRecord>(storedChallenge);
            if (!input.expectedBinding || record.binding !== input.expectedBinding) {
                throw new AuthError('challenge_invalid');
            }

            if (input.expectedReturnTo && record.returnTo !== input.expectedReturnTo) {
                throw new AuthError('challenge_invalid');
            }

            if (record.expiresAt <= now()) {
                if (record.did) await consumeOwnerRecord(key);
                else await store.del(key);
                throw new AuthError('challenge_expired');
            }

            // Claim before DIDKit verification. Every proof attempt consumes this challenge;
            // Clients must create a new challenge after an invalid presentation.
            const consumedChallenge = record.did
                ? await consumeOwnerRecord(key)
                : await store.getdel(key);

            if (!consumedChallenge) throw new AuthError('challenge_replayed');

            const consumedRecord = parseRecord<ChallengeRecord>(consumedChallenge);

            if (
                consumedRecord.binding !== record.binding ||
                consumedRecord.audience !== record.audience ||
                consumedRecord.expiresAt !== record.expiresAt ||
                consumedRecord.returnTo !== record.returnTo ||
                consumedRecord.did !== record.did
            ) {
                throw new AuthError('challenge_invalid');
            }

            const verification = await verifyPresentation(input.presentation, {
                challenge: input.challenge,
                domain: consumedRecord.audience,
                proofFormat: 'jwt',
                proofPurpose: 'authentication',
            });

            if (
                verification.errors.length > 0 ||
                !verification.checks.some(check => check === 'JWS' || check === 'proof')
            ) {
                console.warn('DID Auth presentation verification failed', verification);
                throw new AuthError('presentation_invalid');
            }

            if (verification.warnings.length > 0) {
                console.warn('DID Auth presentation verification warnings', verification.warnings);
            }

            const did = getPresentationDid(input.presentation);
            if (record.did && record.did !== did) throw new AuthError('presentation_invalid');

            const sessionId = randomBytes(32).toString('base64url');

            await withOwnerOperation(did, () =>
                setOwnerAuthenticationRecord(
                    store,
                    did,
                    sessionKey(sessionId),
                    JSON.stringify({
                        did,
                        authenticatedAt: now(),
                    } satisfies SessionRecord),
                    AUTH_SESSION_TTL_SECONDS
                )
            );

            return { did, returnTo: record.returnTo, sessionId };
        },

        async getSession(sessionId: string | undefined): Promise<SessionRecord | null> {
            if (!sessionId) return null;

            const value = await store.get(sessionKey(sessionId));

            return value ? parseRecord<SessionRecord>(value) : null;
        },

        async deleteSession(sessionId: string | undefined): Promise<void> {
            if (sessionId) await consumeOwnerRecord(sessionKey(sessionId));
        },

        async createSessionHandoff(input: {
            did: string;
            origin: string;
            sessionId: string;
        }): Promise<{ expiresAt: number; handoff: string }> {
            const handoff = randomBytes(32).toString('base64url');
            const expiresAt = now() + AUTH_SESSION_HANDOFF_TTL_SECONDS * 1000;

            await withOwnerOperation(input.did, () =>
                setOwnerAuthenticationRecord(
                    store,
                    input.did,
                    sessionHandoffKey(handoff),
                    JSON.stringify({
                        ...input,
                        expiresAt,
                    } satisfies SessionHandoffRecord),
                    AUTH_SESSION_HANDOFF_TTL_SECONDS
                )
            );

            return { expiresAt, handoff };
        },

        async consumeSessionHandoff(
            handoff: string,
            origin: string
        ): Promise<{ did: string; sessionId: string }> {
            if (!/^[A-Za-z0-9_-]{32,128}$/.test(handoff)) {
                throw new AuthError('session_handoff_invalid');
            }

            const value = await consumeOwnerRecord(
                sessionHandoffKey(handoff),
                'session_handoff_invalid'
            );

            if (!value) throw new AuthError('session_handoff_replayed');

            let record: SessionHandoffRecord;

            try {
                record = JSON.parse(value) as SessionHandoffRecord;
            } catch {
                throw new AuthError('session_handoff_invalid');
            }

            if (record.expiresAt <= now()) {
                throw new AuthError('session_handoff_expired');
            }

            if (record.origin !== origin) {
                throw new AuthError('session_handoff_invalid');
            }

            const sessionValue = await store.get(sessionKey(record.sessionId));

            if (!sessionValue) throw new AuthError('session_handoff_invalid');

            let session: SessionRecord;

            try {
                session = JSON.parse(sessionValue) as SessionRecord;
            } catch {
                throw new AuthError('session_handoff_invalid');
            }

            if (session.did !== record.did) {
                throw new AuthError('session_handoff_invalid');
            }

            return withOwnerOperation(record.did, async () => ({
                did: record.did,
                sessionId: record.sessionId,
            }));
        },

        async createWebSocketTicket(input: {
            did: string;
            origin: string;
            sessionId: string;
        }): Promise<{ expiresAt: number; ticket: string }> {
            const ticket = randomBytes(32).toString('base64url');
            const expiresAt = now() + AUTH_WEBSOCKET_TICKET_TTL_SECONDS * 1000;

            await withOwnerOperation(input.did, () =>
                setOwnerAuthenticationRecord(
                    store,
                    input.did,
                    websocketTicketKey(ticket),
                    JSON.stringify({
                        ...input,
                        expiresAt,
                    } satisfies WebSocketTicketRecord),
                    AUTH_WEBSOCKET_TICKET_TTL_SECONDS
                )
            );

            return { expiresAt, ticket };
        },

        async consumeWebSocketTicket(
            ticket: string,
            origin: string
        ): Promise<{ did: string; sessionId: string }> {
            if (!/^[A-Za-z0-9_-]{32,128}$/.test(ticket)) {
                throw new AuthError('websocket_ticket_invalid');
            }

            const value = await consumeOwnerRecord(
                websocketTicketKey(ticket),
                'websocket_ticket_invalid'
            );

            if (!value) throw new AuthError('websocket_ticket_replayed');

            let record: WebSocketTicketRecord;

            try {
                record = JSON.parse(value) as WebSocketTicketRecord;
            } catch {
                throw new AuthError('websocket_ticket_invalid');
            }

            if (record.expiresAt <= now()) {
                throw new AuthError('websocket_ticket_expired');
            }

            if (record.origin !== origin) {
                throw new AuthError('websocket_ticket_invalid');
            }

            const sessionValue = await store.get(sessionKey(record.sessionId));

            if (!sessionValue) throw new AuthError('websocket_ticket_invalid');

            let session: SessionRecord;

            try {
                session = JSON.parse(sessionValue) as SessionRecord;
            } catch {
                throw new AuthError('websocket_ticket_invalid');
            }

            if (session.did !== record.did) {
                throw new AuthError('websocket_ticket_invalid');
            }

            return withOwnerOperation(record.did, async () => ({
                did: record.did,
                sessionId: record.sessionId,
            }));
        },
    };
};

const redis = (cache.redis ?? cache.node) as AuthStore;
const didkit = readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));
const verifier = initLearnCard({ allowRemoteContexts: true, didkit });

export const authService = createAuthService({
    store: redis,
    withOwnerOperation: runOwnerOperation,
    verifyPresentation: async (presentation, options) => {
        const learnCard = await verifier;

        // Fresh login must resolve the current profile authentication relationship.
        await learnCard.invoke.clearDidWebCache();
        return learnCard.invoke.verifyPresentation(presentation, options);
    },
});
