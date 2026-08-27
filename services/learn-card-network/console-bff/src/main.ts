import Redis from 'ioredis';
import { MongoClient } from 'mongodb';

import { loadConfig } from './config';
import { getKeyManagementService, LocalKeyManagementService, type ManagedKeyRef } from '@kms';
import {
    DidDocumentService,
    createMongoKeyDirectory,
    didWebFromDomain,
    type MutableManagedKeyDirectory,
} from '@did';
import { SessionStore, LoginStateStore, type RedisLike } from '@session';
import { ProviderRegistry, AuthCoordinatorProvider } from '@providers';
import {
    JitProvisioner,
    KmsManagedIdentityMinter,
    BrainServiceMembershipGranter,
    createMongoBindingRepository,
} from '@identity-provisioning';
import {
    DidAuthProfileCreator,
    ServiceDidMembershipWriter,
    HttpBrainServiceTransport,
    StubBrainServiceTransport,
    type BrainServiceTransport,
} from '@brain';
import { createFilePolicyResolver } from './policy/file-policy-resolver';
import { ConsoleAuthService } from './app';
import { buildServer } from './server';

function ioredisAsRedisLike(redis: Redis): RedisLike {
    return {
        get: key => redis.get(key),
        set: (key, value, _mode, ttl) => redis.set(key, value, 'EX', ttl),
        del: (...keys) => redis.del(...keys),
        expire: (key, ttl) => redis.expire(key, ttl),
        sadd: (key, ...members) => redis.sadd(key, ...members),
        smembers: key => redis.smembers(key),
        srem: (key, ...members) => redis.srem(key, ...members),
    };
}

// DEV ONLY: decodes the presentation to read its holder DID without verifying the signature.
// Gated behind CONSOLE_BFF_DEV_INSECURE_AUTH so it can never silently run in production; a real
// deployment must supply a verifier that resolves the presenter's DID and checks the JWS.
function makeDevVerifyDidAuth(enabled: boolean) {
    return async (vpJwt: string): Promise<{ did: string; assuranceLevel: 'standard' | 'mfa' }> => {
        if (!enabled) {
            throw new Error(
                'No DID-Auth verifier configured (set CONSOLE_BFF_DEV_INSECURE_AUTH=true for dev)'
            );
        }

        const segment = vpJwt.split('.')[1];
        const payload = segment ? JSON.parse(Buffer.from(segment, 'base64url').toString()) : {};
        const did = payload?.vp?.holder ?? payload?.iss;

        if (typeof did !== 'string') throw new Error('Presentation is missing a holder DID');

        return { did, assuranceLevel: 'standard' };
    };
}

async function main(): Promise<void> {
    const config = loadConfig();

    const mongoClient = new MongoClient(config.mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db(config.mongoDb);

    const redis = new Redis({ host: config.redis.host, port: config.redis.port });
    const redisLike = ioredisAsRedisLike(redis);

    const kms = getKeyManagementService();
    const directory: MutableManagedKeyDirectory = await createMongoKeyDirectory(db);

    const serviceKeyRef = await kms.generateSigningKey({
        tenantId: '_platform',
        alias: config.serviceAlias,
    });
    const serviceDid = didWebFromDomain(config.consoleDomain, config.serviceAlias);
    await directory.put(serviceDid, serviceKeyRef);

    // The directory is durable but the local KMS may not be, so a stored ref can
    // outlive its key material. JIT will not re-mint for an already-known subject,
    // which would otherwise wedge that identity permanently. Re-key in place so the
    // managed DID — and any roles granted to it — survive.
    const resolveKeyRef = async (did: string): Promise<ManagedKeyRef | null> => {
        const ref = await directory.getKeyRef(did);

        if (!ref) return null;

        if (kms instanceof LocalKeyManagementService && !kms.hasKey(ref)) {
            const adopted = await kms.adoptKey(ref);

            await directory.put(did, adopted);
            console.warn(
                `[kms] re-keyed stale local KMS ref for ${did} (key ${ref.keyId} had no material)`
            );

            return adopted;
        }

        return ref;
    };

    const brainUrl = config.brainServiceUrl;
    const useStubBrain = !brainUrl || brainUrl === 'stub';

    if (useStubBrain) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                'BRAIN_SERVICE_URL is required in production; refusing to start against the stub brain transport.'
            );
        }

        // The stub answers every call with `{}` and HTTP 200, which looks like success
        // to callers and shows up as empty/garbled UI rather than a connection error.
        // Say so loudly instead of letting it be diagnosed downstream.
        console.warn(
            [
                '',
                '  ⚠  console-bff is using the STUB brain-service transport.',
                '     Every brain-service call resolves to `{}` with HTTP 200 — nothing is',
                '     persisted, and list endpoints do not return arrays.',
                `     ${
                    brainUrl === 'stub'
                        ? 'Selected explicitly via BRAIN_SERVICE_URL=stub.'
                        : 'BRAIN_SERVICE_URL is unset.'
                }`,
                '     Set BRAIN_SERVICE_URL=http://localhost:4000 to use a real brain-service.',
                '',
            ].join('\n')
        );
    }

    const transport: BrainServiceTransport =
        !brainUrl || brainUrl === 'stub'
            ? new StubBrainServiceTransport()
            : new HttpBrainServiceTransport({ baseUrl: brainUrl });

    const bindings = await createMongoBindingRepository(db);

    const jit = new JitProvisioner({
        minter: new KmsManagedIdentityMinter({
            kms,
            directory,
            profiles: new DidAuthProfileCreator({
                kms,
                transport,
                keyRefFor: resolveKeyRef,
            }),
            consoleDomain: config.consoleDomain,
        }),
        membership: new BrainServiceMembershipGranter(
            new ServiceDidMembershipWriter({ kms, transport, serviceDid, serviceKeyRef })
        ),
        bindings,
    });

    const resolvePolicy = createFilePolicyResolver(config.policyFile);

    const registry = new ProviderRegistry().register(
        'auth-coordinator',
        providerConfig =>
            new AuthCoordinatorProvider({
                providerId: providerConfig.providerId,
                jit,
                resolvePolicy,
                verifyDidAuth: makeDevVerifyDidAuth(config.devInsecureAuth),
            })
    );

    const authService = new ConsoleAuthService({
        registry,
        sessions: new SessionStore({ redis: redisLike }),
        resolvePolicy,
        stateStore: new LoginStateStore(redisLike),
    });

    const app = buildServer({
        transport,
        kms,
        keyRefFor: resolveKeyRef,
        directory,
        consoleDomain: config.consoleDomain,
        authService,
        cookieSecret: config.cookieSecret,
        secureCookies: config.secureCookies,
        didDocuments: new DidDocumentService({ kms, directory }),
    });

    await app.listen({ port: config.port, host: config.host });

    app.log.info(
        {
            serviceDid,
            brain: config.brainServiceUrl ?? 'stub',
            consoleDomain: config.consoleDomain,
        },
        'console-bff ready'
    );
}

main().catch(error => {
    console.error('console-bff failed to start', error);
    process.exit(1);
});
