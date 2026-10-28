import { expect, test } from 'bun:test';

const REQUIRED_ENV = ['MONGO_URI', 'OPENAI_API_KEY', 'SEED', 'REDIS_HOST', 'REDIS_PORT'] as const;

test('backend entrypoints import without starting services or requiring env', async () => {
    const env = { ...process.env };

    for (const name of REQUIRED_ENV) delete env[name];

    const child = Bun.spawn(
        [
            process.execPath,
            '-e',
            `
        const api = await import("./index.ts");
        const mcp = await import("./mcp-server/index.ts");
        const workers = await import("./workers/index.ts");
        console.log(
          typeof api.startApiServer,
          typeof mcp.startMcpServer,
          typeof workers.startWorkers,
        );
      `,
        ],
        {
            cwd: import.meta.dir,
            env,
            stdout: 'pipe',
            stderr: 'pipe',
        }
    );

    const exitCode = await child.exited;
    const stdout = await new Response(child.stdout).text();
    const stderr = await new Response(child.stderr).text();

    expect(exitCode, stderr).toBe(0);
    expect(stdout.trim()).toBe('function function function');
});
