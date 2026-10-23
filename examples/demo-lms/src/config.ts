import type { JWK } from 'jose';

/** Demo LMS configuration. Secrets come from the environment and are never logged. */
export type DemoLmsConfig = {
    port: number;
    brainUrl: string;
    /** This server's own health URL exactly as pinned in the signed manifest. */
    healthUrl: string;
    serviceAccountId: string;
    serviceAccountSecret: string;
    installId: string;
    ecosystemId: string;
    /** Platform signing JWK, pinned over a trusted channel (INTEGRATION-AUTH.md). */
    platformJwk: JWK;
};

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable ${name}.`);
    return value;
};

/** The platform key is Ed25519 (OKP); accept exactly the public fields that implies. */
const parsePlatformJwk = (raw: string): JWK => {
    const parsed: unknown = JSON.parse(raw);
    const field = (name: string): string => {
        const value: unknown =
            parsed && typeof parsed === 'object' ? Reflect.get(parsed, name) : undefined;
        if (typeof value !== 'string') throw new Error(`PLATFORM_JWK is missing ${name}.`);
        return value;
    };
    if (field('kty') !== 'OKP' || field('crv') !== 'Ed25519') {
        throw new Error('PLATFORM_JWK must be an Ed25519 public key.');
    }
    return { kty: 'OKP', crv: 'Ed25519', x: field('x') };
};

export const loadConfig = (): DemoLmsConfig => ({
    port: Number(process.env.DEMO_LMS_PORT ?? 4321),
    brainUrl: required('BRAIN_URL').replace(/\/$/, ''),
    healthUrl: required('DEMO_LMS_HEALTH_URL'),
    serviceAccountId: required('SERVICE_ACCOUNT_ID'),
    serviceAccountSecret: required('SERVICE_ACCOUNT_SECRET'),
    installId: required('INSTALL_ID'),
    ecosystemId: required('ECOSYSTEM_ID'),
    platformJwk: parsePlatformJwk(required('PLATFORM_JWK')),
});
