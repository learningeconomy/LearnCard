import { describe, expect, it } from 'vitest';
import { parseLcaApiEnvironment } from './environment';

const production = {
    NODE_ENV: 'production',
    DOMAIN_NAME: 'api.example.com',
    SEED: 'a'.repeat(64),
    MONGO_URI: 'mongodb://localhost:27017',
    MONGO_DB_NAME: 'test',
};

describe('signing-authority seed environment', () => {
    it.each(['1', 'true'])('keeps offline development plaintext without a KEK (%s)', offline => {
        const env = parseLcaApiEnvironment({
            ...production,
            NODE_ENV: 'development',
            IS_OFFLINE: offline,
            SA_SEED_LOCAL_KEK: '',
        });
        expect(env.SA_SEED_LOCAL_KEK).toBeUndefined();
        expect(env.SA_SEED_ENCRYPT_WRITES).toBe(false);
        expect(env.SA_SEED_ALLOW_LEGACY_READ).toBe(true);
    });
    it('requires an explicit key when offline development opts into encryption', () => {
        const raw = {
            ...production,
            NODE_ENV: 'development',
            IS_OFFLINE: 'true',
            SA_SEED_ENCRYPT_WRITES: 'true',
        };
        expect(() => parseLcaApiEnvironment(raw)).toThrow();
        const env = parseLcaApiEnvironment({ ...raw, SA_SEED_LOCAL_KEK: 'b'.repeat(64) });
        expect(env.SA_SEED_ENCRYPT_WRITES).toBe(true);
        expect(env.SA_SEED_ALLOW_LEGACY_READ).toBe(true);
        expect(env.SA_SEED_LOCAL_KEK).toBe('b'.repeat(64));
    });
    it('does not enable encryption just because a local key is configured', () => {
        const env = parseLcaApiEnvironment({
            ...production,
            IS_OFFLINE: 'true',
            SA_SEED_LOCAL_KEK: 'b'.repeat(64),
        });
        expect(env.SA_SEED_ENCRYPT_WRITES).toBe(false);
        expect(env.SA_SEED_ALLOW_LEGACY_READ).toBe(true);
        expect(() =>
            parseLcaApiEnvironment({ ...production, IS_OFFLINE: 'true', SA_SEED_LOCAL_KEK: 'bad' })
        ).toThrow();
    });
    it.each(['production', 'development'])('keeps online %s defaults encrypted', nodeEnv => {
        const env = parseLcaApiEnvironment({
            ...production,
            NODE_ENV: nodeEnv,
            SA_SEED_KMS_KEY_ARN:
                'arn:aws:kms:us-east-1:123456789012:key/11111111-1111-1111-1111-111111111111',
        });
        expect(env.SA_SEED_ENCRYPT_WRITES).toBe(true);
        expect(env.SA_SEED_ALLOW_LEGACY_READ).toBe(false);
    });
    it('defaults tests to ciphertext writes without AWS', () => {
        const env = parseLcaApiEnvironment({ NODE_ENV: 'test', IS_OFFLINE: 'true' });
        expect(env.SA_SEED_LOCAL_KEK).toHaveLength(64);
        expect(env.SA_SEED_ENCRYPT_WRITES).toBe(true);
        expect(env.SA_SEED_ALLOW_LEGACY_READ).toBe(false);
    });
    it('requires KMS for online deployments regardless of NODE_ENV', () => {
        expect(() => parseLcaApiEnvironment(production)).toThrow();
        expect(() => parseLcaApiEnvironment({ ...production, NODE_ENV: 'development' })).toThrow();
        expect(() => parseLcaApiEnvironment({ ...production, IS_E2E_TEST: 'true' })).toThrow();
    });
    it('requires a real key ARN, or an explicit offline KEK', () => {
        expect(() =>
            parseLcaApiEnvironment({ ...production, SA_SEED_KMS_KEY_ARN: 'alias/test' })
        ).toThrow();
        expect(() =>
            parseLcaApiEnvironment({
                ...production,
                IS_OFFLINE: 'true',
                SA_SEED_ENCRYPT_WRITES: 'true',
            })
        ).toThrow();
        expect(() =>
            parseLcaApiEnvironment({
                ...production,
                IS_OFFLINE: 'true',
                SA_SEED_ENCRYPT_WRITES: 'true',
                SA_SEED_LOCAL_KEK: 'f'.repeat(64),
            })
        ).not.toThrow();
        expect(() =>
            parseLcaApiEnvironment({
                ...production,
                SA_SEED_KMS_KEY_ARN:
                    'arn:aws:kms:us-east-1:123456789012:key/11111111-1111-1111-1111-111111111111',
            })
        ).not.toThrow();
    });
    it('does not allow a writer that its own reader cannot read', () => {
        expect(() =>
            parseLcaApiEnvironment({
                ...production,
                IS_OFFLINE: 'true',
                SA_SEED_ALLOW_LEGACY_READ: 'false',
            })
        ).toThrow();
        expect(() =>
            parseLcaApiEnvironment({ NODE_ENV: 'test', SA_SEED_ENCRYPT_WRITES: 'false' })
        ).toThrow();
        expect(() =>
            parseLcaApiEnvironment({
                NODE_ENV: 'test',
                SA_SEED_ENCRYPT_WRITES: 'false',
                SA_SEED_ALLOW_LEGACY_READ: 'true',
            })
        ).not.toThrow();
    });
});
