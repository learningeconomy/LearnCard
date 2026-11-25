import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const result = await Bun.build({
    entrypoints: [resolve(import.meta.dir, 'web3auth-multi-tab.ts')],
    target: 'browser',
    format: 'iife',
    define: { 'import.meta.env': '{}' },
    plugins: [
        {
            name: 'simulate-web3auth-boundary',
            setup(builder) {
                builder.onResolve(
                    { filter: /^@web3auth\/(single-factor-auth|ethereum-provider|base)$/ },
                    () => ({ path: 'simulated-sdk', namespace: 'web3auth-test' })
                );
                builder.onLoad({ filter: /.*/, namespace: 'web3auth-test' }, () => ({
                    contents: readFileSync(resolve(import.meta.dir, 'web3auth-sdk.ts'), 'utf8'),
                    loader: 'ts',
                }));
            },
        },
    ],
});
if (!result.success) throw new Error(result.logs.map(log => log.message).join('\n'));
await Bun.write(process.argv[2]!, result.outputs[0]!);
