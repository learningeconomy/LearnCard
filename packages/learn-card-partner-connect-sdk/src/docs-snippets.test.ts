// @vitest-environment jsdom
/**
 * Runs the Partner Connect code samples embedded in the docs (docs/snippets/,
 * kept byte-identical to the pages by scripts/check-docs-snippets.mjs) in
 * practice mode, and checks what the pages promise.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPartnerConnect } from './index';
import type { PartnerConnect } from './index';

const SNIPPETS = resolve(__dirname, '../../../docs/snippets');
const IMPORT_LINE = "import { createPartnerConnect } from '@learncard/partner-connect';";

type AsyncFn = (...args: unknown[]) => Promise<Record<string, unknown>>;
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (
    ...args: string[]
) => AsyncFn;

const clients: PartnerConnect[] = [];

const runSnippet = async (path: string, returns: string[]) => {
    const source = readFileSync(resolve(SNIPPETS, path), 'utf8');
    expect(source).toContain(IMPORT_LINE);

    const logs: unknown[][] = [];
    const run = new AsyncFunction(
        'createPartnerConnect',
        'console',
        `${source.replace(IMPORT_LINE, '')}\nreturn { ${returns.join(', ')} };`
    );
    const create = (...args: Parameters<typeof createPartnerConnect>) => {
        const client = createPartnerConnect(...args);
        clients.push(client);
        return client;
    };

    const values = await run(create, { log: (...args: unknown[]) => logs.push(args) });
    return { values, logs };
};

describe('docs snippets (practice mode)', () => {
    afterEach(() => {
        clients.splice(0).forEach(client => client.destroy());
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('publish-your-app/build.ts signs in, awards an inline template, and gets consent', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const { values } = await runSnippet('publish-your-app/build.ts', [
            'learnCard',
            'user',
            'credential',
            'granted',
        ]);

        expect((values.user as { did: string }).did).toMatch(/^did:/);
        expect(values.credential).toMatchObject({ templateVersion: 1 });
        expect((values.credential as { credentialUri: string }).credentialUri).toBeTruthy();
        expect(values.granted).toBe(true);

        const manifest = (values.learnCard as PartnerConnect).getCapturedManifest();
        expect(manifest?.templates.map(template => template.alias)).toEqual(['course-complete']);
        expect(manifest?.consentRequests).toHaveLength(1);
    });

    it('partner-connect/send-inline-template.ts logs a credential and template version', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const { logs } = await runSnippet('partner-connect/send-inline-template.ts', []);

        expect(logs).toHaveLength(1);
        const [credentialUri, templateVersion] = logs[0];
        expect(credentialUri).toBeTruthy();
        expect(templateVersion).toBe(1);
    });
});
