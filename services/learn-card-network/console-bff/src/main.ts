import Redis from 'ioredis';
import { MongoClient } from 'mongodb';

import { loadConfig } from './config';
import { getKeyManagementService } from '@kms';
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
} from '@provisioning';
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

    const transport: BrainServiceTransport = config.brainServiceUrl
        ? new HttpBrainServiceTransport({ baseUrl: config.brainServiceUrl })
        : new StubBrainServiceTransport();

    const bindings = await createMongoBindingRepository(db);

    const jit = new JitProvisioner({
        minter: new KmsManagedIdentityMinter({
            kms,
            directory,
            profiles: new DidAuthProfileCreator({
                kms,
                transport,
                keyRefFor: did => directory.getKeyRef(did),
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
