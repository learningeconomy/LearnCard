import { createHash, randomBytes } from 'node:crypto';

import type { Request } from 'express';
import type { Db, Filter } from 'mongodb';
import { z } from 'zod';

import type { ServiceConfig } from '../config';

export const AGENT_DID_AUTH_CHALLENGE_COLLECTION = 'agentDidAuthChallenges';

export type AgentDidAuthContext = { did: string; challenge: string; domain: string };

export type AgentDidAuthChallenge = {
    challengeHash: string;
    domain: string;
    createdAt: Date;
    expiresAt: Date;
};

export interface AgentDidAuthChallengeStore {
    insert: (challenge: string, domain: string, ttlMs: number) => Promise<AgentDidAuthChallenge>;
    getByHash: (challengeHash: string) => Promise<AgentDidAuthChallenge | undefined>;
    consume: (challengeHash: string) => Promise<AgentDidAuthChallenge | undefined>;
}

export interface AgentDidAuthVerifierLearnCard {
    invoke: {
        verifyPresentation: (vpJwt: string, options: Record<string, unknown>) => Promise<unknown>;
    };
}

export class AgentDidAuthError extends Error {
    readonly status = 401;

    constructor(message = 'DID Auth is required.') {
        super(message);
        this.name = 'AgentDidAuthError';
    }
}

const JwtPayloadValidator = z
    .object({
        nonce: z.string().min(1),
        vp: z.object({ holder: z.string().min(1) }).passthrough(),
    })
    .passthrough();

const VerificationResultValidator = z
    .object({
        checks: z.array(z.string()),
        warnings: z.array(z.unknown()),
        errors: z.array(z.unknown()),
    })
    .passthrough();

export const createSecureChallenge = (): string => randomBytes(32).toString('base64url');

export const hashChallenge = (challenge: string): string =>
    createHash('sha256').update(challenge).digest('hex');

export const createMongoDidAuthChallengeStore = (db: Db): AgentDidAuthChallengeStore => {
    const collection = db.collection<AgentDidAuthChallenge>(AGENT_DID_AUTH_CHALLENGE_COLLECTION);
    let indexesReady: Promise<void> | undefined;

    const ensureIndexes = async (): Promise<void> => {
        indexesReady ??= Promise.all([
            collection.createIndex({ challengeHash: 1 }, { unique: true }),
            collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        ]).then(() => undefined);

        await indexesReady;
    };

    return {
        insert: async (challenge, domain, ttlMs) => {
            await ensureIndexes();

            const createdAt = new Date();
            const doc = {
                challengeHash: hashChallenge(challenge),
                domain,
                createdAt,
                expiresAt: new Date(createdAt.getTime() + ttlMs),
            };

            await collection.insertOne(doc);

            return doc;
        },
        getByHash: async challengeHash => {
            await ensureIndexes();

            return (
                (await collection.findOne({ challengeHash } as Filter<AgentDidAuthChallenge>)) ??
                undefined
            );
        },
        consume: async challengeHash => {
            await ensureIndexes();

            const result = await collection.findOneAndDelete({
                challengeHash,
                expiresAt: { $gt: new Date() },
            } as Filter<AgentDidAuthChallenge>);

            return result ?? undefined;
        },
    };
};

export const createInMemoryDidAuthChallengeStore = (): AgentDidAuthChallengeStore => {
    const challenges = new Map<string, AgentDidAuthChallenge>();

    return {
        insert: async (challenge, domain, ttlMs) => {
            const createdAt = new Date();
            const doc = {
                challengeHash: hashChallenge(challenge),
                domain,
                createdAt,
                expiresAt: new Date(createdAt.getTime() + ttlMs),
            };

            challenges.set(doc.challengeHash, doc);

            return doc;
        },
        getByHash: async challengeHash => challenges.get(challengeHash),
        consume: async challengeHash => {
            const doc = challenges.get(challengeHash);

            if (!doc || doc.expiresAt.getTime() <= Date.now()) return undefined;

            challenges.delete(challengeHash);

            return doc;
        },
    };
};

const decodeJwtPayload = (vpJwt: string): z.infer<typeof JwtPayloadValidator> => {
    const [, payload] = vpJwt.split('.');

    if (!payload) throw new AgentDidAuthError();

    try {
        return JwtPayloadValidator.parse(
            JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
        );
    } catch {
        throw new AgentDidAuthError();
    }
};

const getBearerToken = (req: Request): string => {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) throw new AgentDidAuthError();

    return token;
};

export const verifyDidAuthRequest = async (
    req: Request,
    {
        config: _config,
        challengeStore,
        getVerifierLearnCard,
    }: {
        config: ServiceConfig;
        challengeStore: AgentDidAuthChallengeStore;
        getVerifierLearnCard: () => Promise<AgentDidAuthVerifierLearnCard>;
    }
): Promise<AgentDidAuthContext> => {
    const vpJwt = getBearerToken(req);
    const decoded = decodeJwtPayload(vpJwt);
    const challengeHash = hashChallenge(decoded.nonce);
    const stored = await challengeStore.getByHash(challengeHash);

    if (!stored || stored.expiresAt.getTime() <= Date.now()) throw new AgentDidAuthError();

    const verifier = await getVerifierLearnCard();
    const verification = await (async () => {
        try {
            return VerificationResultValidator.parse(
                await verifier.invoke.verifyPresentation(vpJwt, {
                    proofFormat: 'jwt',
                    challenge: decoded.nonce,
                    domain: stored.domain,
                    proofPurpose: 'authentication',
                })
            );
        } catch {
            throw new AgentDidAuthError();
        }
    })();

    if (
        verification.warnings.length > 0 ||
        verification.errors.length > 0 ||
        !verification.checks.includes('JWS')
    ) {
        throw new AgentDidAuthError();
    }

    const consumed = await challengeStore.consume(challengeHash);

    if (!consumed) throw new AgentDidAuthError();

    return {
        did: decoded.vp.holder,
        challenge: decoded.nonce,
        domain: stored.domain,
    };
};
