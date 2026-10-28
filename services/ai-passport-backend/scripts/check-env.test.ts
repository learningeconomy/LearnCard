import { describe, expect, test } from 'bun:test';

const run = async (environment: Record<string, string>) => {
    const child = Bun.spawn([process.execPath, '--no-env-file', 'scripts/check-env.ts'], {
        cwd: new URL('..', import.meta.url).pathname,
        env: {
            PATH: process.env.PATH ?? '',
            HOME: '/nonexistent',
            AWS_CONFIG_FILE: '/nonexistent',
            AWS_SHARED_CREDENTIALS_FILE: '/nonexistent',
            ...environment,
        },
        stdout: 'pipe',
        stderr: 'pipe',
    });
    return {
        exitCode: await child.exited,
        stdout: await new Response(child.stdout).text(),
        stderr: await new Response(child.stderr).text(),
    };
};

const infra = {
    MONGO_URI: 'mongodb://127.0.0.1:1/x',
    SEED: 'synthetic',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '1',
};

describe('bun run check:env', () => {
    test('reports infra, provider and bypass problems together and exits once', async () => {
        const { exitCode, stderr } = await run({
            LLM_PROVIDER: 'nope',
            EMBEDDINGS_PROVIDER: 'typo',
            DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL: 'yes',
        });
        expect(exitCode).toBe(1);
        expect(stderr).toContain('Invalid backend environment:');
        expect(stderr).toContain(
            'Missing or invalid required environment variables: MONGO_URI, SEED, REDIS_HOST, REDIS_PORT'
        );
        expect(stderr).toContain('LLM_PROVIDER must be bedrock or openai (got "nope")');
        expect(stderr).toContain('EMBEDDINGS_PROVIDER must be bedrock or openai (got "typo")');
        expect(stderr).toContain('DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL must be exactly "true"');
        // Typos in both provider names still surface the key OpenAI embeddings need.
        expect(stderr).toContain('OPENAI_API_KEY is required (EMBEDDINGS_PROVIDER=openai)');
    });

    test('a production signing-policy refusal is thrown before infra and bypass problems are aggregated', async () => {
        const environment = {
            LLM_PROVIDER: 'openai',
            OPENAI_API_KEY: 'sk-synthetic',
            DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL: 'true',
            NODE_ENV: 'production',
        };
        // The signing policy throws a plain Error first, and check:env prints only
        // its generic line for errors that are not a BackendEnvironmentError.
        const { exitCode, stderr } = await run(environment);
        expect(exitCode).toBe(1);
        expect(stderr.trim()).toBe('Environment check failed');

        // The error behind that line is the signing-policy refusal.
        const child = Bun.spawn(
            [
                process.execPath,
                '--no-env-file',
                '-e',
                `
        const { validateBackendEnvironment } = await import('./src/constants/env.ts');
        try { validateBackendEnvironment(); process.exit(2); }
        catch (error) { console.error(error.name + ': ' + error.message); }
      `,
            ],
            {
                cwd: new URL('..', import.meta.url).pathname,
                env: {
                    PATH: process.env.PATH ?? '',
                    HOME: '/nonexistent',
                    AWS_CONFIG_FILE: '/nonexistent',
                    AWS_SHARED_CREDENTIALS_FILE: '/nonexistent',
                    ...environment,
                },
                stdout: 'pipe',
                stderr: 'pipe',
            }
        );
        expect(await child.exited).toBe(0);
        expect((await new Response(child.stderr).text()).trim()).toBe(
            'Error: Production JWT_SECRET must be explicit and separate from SEED'
        );
    });

    test('with valid production signing, a refused bypass is reported alongside missing infra vars', async () => {
        const { exitCode, stderr } = await run({
            LLM_PROVIDER: 'openai',
            OPENAI_API_KEY: 'sk-synthetic',
            DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL: 'true',
            NODE_ENV: 'production',
            JWT_SECRET: 'synthetic-only-0123456789-ABCDEFGHIJK',
        });
        expect(exitCode).toBe(1);
        expect(stderr).toContain('Missing or invalid required environment variables');
        expect(stderr).toContain('refused outside local development (NODE_ENV=production)');
    });

    test('prints OK for a valid local OpenAI setup', async () => {
        const { exitCode, stdout } = await run({
            ...infra,
            LLM_PROVIDER: 'openai',
            OPENAI_API_KEY: 'sk-synthetic',
        });
        expect(exitCode).toBe(0);
        expect(stdout).toContain(
            'Backend environment OK (LLM_PROVIDER=openai, EMBEDDINGS_PROVIDER=openai, privacy guardrail on)'
        );
    });
});
