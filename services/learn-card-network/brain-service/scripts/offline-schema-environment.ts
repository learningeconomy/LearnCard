// These tools only import validators/routes; they must never inherit service credentials.
export function configureOfflineSchemaEnvironment(): void {
    for (const name of Object.keys(process.env)) {
        if (!['PATH', 'HOME', 'TMPDIR'].includes(name)) delete process.env[name];
    }
    Object.assign(process.env, {
        NODE_ENV: 'test',
        DOTENV_CONFIG_PATH: '/dev/null',
        SEED: 'a'.repeat(64),
        NEO4J_URI: 'bolt://127.0.0.1:1',
        NEO4J_USERNAME: 'schema-export',
        NEO4J_PASSWORD: 'synthetic-schema-export',
        NEO4J_SKIP_INDICES: 'true',
        SKIP_DIDKIT_NAPI: 'true',
        SKIP_SKILL_FRAMEWORK_SEED: 'true',
        TRACE_CONSOLE: 'false',
    });
}
