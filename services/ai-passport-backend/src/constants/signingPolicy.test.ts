import { expect, test } from 'bun:test';
import { validateProductionSigningPolicy } from './signingPolicy';

const distinctSynthetic = 'synthetic-only-0123456789-ABCDEFGHIJK';
for (const jwtSecret of [
    undefined,
    '',
    'short',
    'a'.repeat(64),
    'test-' + distinctSynthetic,
    'example-' + distinctSynthetic,
    'change_me-' + distinctSynthetic,
    'your-secret-key-here-change-in-production',
    ' your-secret-key-here-change-in-production',
]) {
    test('production rejects missing, short, repetitive or example material without disclosure', () => {
        let error: unknown;
        try {
            validateProductionSigningPolicy({
                nodeEnv: 'production',
                jwtSecret,
                seed: 'different-synthetic-seed',
            });
        } catch (caught) {
            error = caught;
        }
        expect(error).toBeInstanceOf(Error);
        if (jwtSecret) expect(String(error)).not.toContain(jwtSecret);
    });
}
test('production rejects SEED reuse even when length passes', () => {
    expect(() =>
        validateProductionSigningPolicy({
            nodeEnv: 'production',
            jwtSecret: distinctSynthetic,
            seed: distinctSynthetic,
        })
    ).toThrow('separate from SEED');
});
test('production permits a distinct non-placeholder value without asserting randomness', () => {
    expect(() =>
        validateProductionSigningPolicy({
            nodeEnv: 'production',
            jwtSecret: distinctSynthetic,
            seed: 'different-synthetic-seed',
        })
    ).not.toThrow();
});
test('nonproduction synthetic configuration stays compatible', () => {
    expect(() =>
        validateProductionSigningPolicy({ nodeEnv: 'test', jwtSecret: 'test', seed: 'test' })
    ).not.toThrow();
    expect(() =>
        validateProductionSigningPolicy({
            nodeEnv: 'development',
            jwtSecret: undefined,
            seed: 'test',
        })
    ).not.toThrow();
});

for (const [entrypoint, exported] of [
    ['index.ts', 'startApiServer'],
    ['mcp-server/index.ts', 'startMcpServer'],
    ['workers/index.ts', 'startWorkers'],
]) {
    for (const jwtSecret of [undefined, 'short', distinctSynthetic]) {
        test(`${entrypoint} rejects invalid production signing configuration before dependency startup`, async () => {
            const child = Bun.spawn(
                [
                    process.execPath,
                    '-e',
                    `
        const entrypoint = await import(${JSON.stringify('./' + entrypoint)});
        try { await entrypoint[${JSON.stringify(exported)}](); process.exit(2); }
        catch (error) {
          if (!String(error.message).startsWith("Production JWT_SECRET")) process.exit(3);
        }
      `,
                ],
                {
                    cwd: new URL('..', import.meta.url).pathname,
                    env: {
                        PATH: process.env.PATH,
                        NODE_ENV: 'production',
                        SEED: distinctSynthetic,
                        ...(jwtSecret === undefined ? {} : { JWT_SECRET: jwtSecret }),
                    },
                    stdout: 'pipe',
                    stderr: 'pipe',
                }
            );
            expect(await child.exited).toBe(0);
        });
    }
}

for (const initialValid of [true, false]) {
    test('bootstrap validates the captured signer even when process.env changes after import', async () => {
        const child = Bun.spawn(
            [
                process.execPath,
                '-e',
                `
      const { validateBackendEnvironment } = await import("./constants/env.ts");
      process.env.JWT_SECRET = ${JSON.stringify(initialValid ? 'short' : distinctSynthetic)};
      let accepted = false;
      try { validateBackendEnvironment(); accepted = true; } catch {}
      if (accepted !== ${JSON.stringify(initialValid)}) process.exit(2);
    `,
            ],
            {
                cwd: new URL('..', import.meta.url).pathname,
                env: {
                    PATH: process.env.PATH,
                    NODE_ENV: 'production',
                    SEED: 'different-synthetic-seed',
                    LLM_PROVIDER: 'openai',
                    JWT_SECRET: initialValid ? distinctSynthetic : 'short',
                    MONGO_URI: 'mongodb://localhost:27017',
                    OPENAI_API_KEY: 'synthetic-offline',
                    REDIS_HOST: 'localhost',
                    REDIS_PORT: '6379',
                    AWS_REGION: 'us-east-1',
                },
                stdout: 'pipe',
                stderr: 'pipe',
            }
        );
        expect(await child.exited).toBe(0);
    });
}

test('shipped signing example remains empty so it cannot configure production', async () => {
    const example = await Bun.file(new URL('../../.env.example', import.meta.url)).text();
    expect(example.match(/^JWT_SECRET=(.*)$/m)?.[1]).toBe('');
    expect(() =>
        validateProductionSigningPolicy({
            nodeEnv: 'production',
            jwtSecret: example.match(/^JWT_SECRET=(.*)$/m)?.[1],
            seed: 'synthetic',
        })
    ).toThrow();
});
