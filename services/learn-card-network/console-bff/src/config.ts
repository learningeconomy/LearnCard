export type ConsoleBffConfig = {
    port: number;
    host: string;
    cookieSecret: string;
    secureCookies: boolean;
    consoleDomain: string;
    serviceAlias: string;
    redis: { host: string; port: number };
    mongoUri: string;
    mongoDb: string;
    brainServiceUrl?: string;
    policyFile: string;
    devInsecureAuth: boolean;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ConsoleBffConfig {
    const isProd = env.NODE_ENV === 'production';

    return {
        port: Number(env.PORT ?? 3200),
        host: env.HOST ?? '0.0.0.0',
        cookieSecret: env.COOKIE_SECRET ?? 'dev-insecure-cookie-secret',
        secureCookies: env.SECURE_COOKIES ? env.SECURE_COOKIES === 'true' : isProd,
        consoleDomain: env.CONSOLE_DOMAIN ?? 'localhost:3200',
        serviceAlias: env.SERVICE_ALIAS ?? 'service',
        redis: {
            host: env.REDIS_HOST ?? '127.0.0.1',
            port: Number(env.REDIS_PORT ?? 6379),
        },
        mongoUri: env.MONGO_URI ?? 'mongodb://127.0.0.1:27017',
        mongoDb: env.MONGO_DB ?? 'console-bff',
        brainServiceUrl: env.BRAIN_SERVICE_URL,
        policyFile: env.TENANT_POLICY_FILE ?? 'dev/policies.json',
        devInsecureAuth: env.CONSOLE_BFF_DEV_INSECURE_AUTH === 'true',
    };
}
