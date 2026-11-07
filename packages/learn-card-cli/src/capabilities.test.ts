/**
 * `capabilities` map: every reference in it must point at something real — a CLI
 * command in the tree, an SDK method in the plugin type definitions, a REST route in
 * the brain service, a tested snippet, and a published docs URL.
 * Reads repo files only; nothing here touches the network.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildProgram } from './program';
import { walkLeafCommands, DOCS_LINKS } from './manifest';
import { CAPABILITIES, runCapabilities } from './capabilities';
import { CliError } from './errors';
import { out } from './out';
import packageJson from '../package.json';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DOCS_BASE = 'https://docs.learncard.com/';

/**
 * Type definitions of the plugins `initLearnCard({ seed, network })` loads (see
 * packages/learn-card-init/src/initializers/networkLearnCardFromSeed.ts). A `call`
 * method must be declared in one of them.
 */
const PLUGIN_TYPE_FILES = [
    'packages/plugins/learn-card-network/src/types.ts',
    'packages/plugins/vc/src/types.ts',
    'packages/plugins/vc-templates/src/types.ts',
    'packages/plugins/learn-cloud/src/types.ts',
    'packages/plugins/didkit/src/types.ts',
    'packages/plugins/vpqr/src/types.ts',
];

const declaredMethods = (): Set<string> => {
    const names = new Set<string>();
    for (const file of PLUGIN_TYPE_FILES) {
        const source = readFileSync(path.join(ROOT, file), 'utf8');
        // A method member of a `...PluginMethods` type: four-space indent, then a function
        // signature (`name: (`, `name: <T>(`) or a named function type (`NewCredentialFunction`).
        for (const match of source.matchAll(
            /^ {4}([a-zA-Z][a-zA-Z0-9]*)\??: (?:\(|<|[A-Z]\w*Function\b)/gm
        ))
            names.add(match[1]!);
    }
    return names;
};

/** Every `path: '/...'` declared in the brain service's OpenAPI route metadata. */
const declaredRestPaths = (): { paths: Set<string>; tags: Set<string> } => {
    const dir = path.join(ROOT, 'services/learn-card-network/brain-service/src/routes');
    const paths = new Set<string>();
    const tags = new Set<string>();
    for (const file of readdirSync(dir).filter(name => name.endsWith('.ts'))) {
        const source = readFileSync(path.join(dir, file), 'utf8');
        for (const match of source.matchAll(/path: '(\/[^']*)'/g)) paths.add(match[1]!);
        for (const match of source.matchAll(/tags: \[([^\]]*)\]/g))
            for (const tag of match[1]!.matchAll(/'([^']+)'/g)) tags.add(tag[1]!);
        // share-links routes build their meta with a helper: openapi('GET', '/share-links', ...)
        for (const match of source.matchAll(/openapi\('(?:GET|POST)', '(\/[^']*)'/g))
            paths.add(match[1]!);
    }
    return { paths, tags };
};

/** Published page URLs, computed by the same SUMMARY.md model GitBook uses. */
const publishedDocsUrls = (): Set<string> =>
    new Set(
        execFileSync('node', [path.join(ROOT, 'scripts/check-docs-links.mjs'), '--urls'], {
            encoding: 'utf8',
        })
            .split('\n')
            .map(line => line.split('\t')[0]!.trim())
    );

const cliCommands = (): string[] => {
    const program = buildProgram({ runRepl: () => undefined, run: async () => undefined });
    return walkLeafCommands(program).map(({ name }) => name);
};

afterEach(() => {
    vi.restoreAllMocks();
    out.json = false;
    out.result = {};
});

describe('capability map references are real', () => {
    it('has 20–30 capabilities with unique kebab-case ids', () => {
        const ids = CAPABILITIES.map(capability => capability.id);
        expect(ids.length).toBeGreaterThanOrEqual(20);
        expect(ids.length).toBeLessThanOrEqual(30);
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });

    it('every cli entry is a command in the manifest', () => {
        const commands = cliCommands();
        const missing = CAPABILITIES.flatMap(capability =>
            capability.cli
                .filter(name => !commands.includes(name))
                .map(n => `${capability.id}: ${n}`)
        );
        expect(missing).toEqual([]);
    });

    it('every call entry is a method declared by a loaded plugin', () => {
        const methods = declaredMethods();
        expect(methods.size, 'plugin method scan found too few methods').toBeGreaterThan(250);
        const missing = CAPABILITIES.flatMap(capability =>
            capability.call.filter(name => !methods.has(name)).map(n => `${capability.id}: ${n}`)
        );
        expect(missing).toEqual([]);
    });

    it('every api path and tag exists in the brain service routes', () => {
        const { paths, tags } = declaredRestPaths();
        expect(paths.size, 'route scan found too few paths').toBeGreaterThan(200);
        for (const capability of CAPABILITIES) {
            if (!capability.api) continue;
            expect(capability.api.tag ?? capability.api.paths, capability.id).toBeDefined();
            if (capability.api.tag) expect(tags, capability.id).toContain(capability.api.tag);
            for (const route of capability.api.paths ?? [])
                expect(paths, `${capability.id}: ${route}`).toContain(route);
        }
    });

    it('every snippet exists under docs/snippets/', () => {
        for (const capability of CAPABILITIES) {
            if (!capability.snippet) continue;
            expect(capability.snippet, capability.id).toMatch(/^docs\/snippets\//);
            expect(existsSync(path.join(ROOT, capability.snippet)), capability.snippet).toBe(true);
        }
    });

    it('every docs URL (and the manifest doc links) is a published GitBook page', () => {
        const urls = publishedDocsUrls();
        expect(urls.size, 'docs URL model returned too few pages').toBeGreaterThan(50);
        const docs = [
            ...CAPABILITIES.map(capability => capability.docs),
            DOCS_LINKS.cli,
            DOCS_LINKS.agents,
        ];
        for (const url of docs) {
            expect(url.startsWith(DOCS_BASE), url).toBe(true);
            const page = url.slice(DOCS_BASE.length).split('#')[0]!;
            expect(urls, url).toContain(page);
        }
    });
});

describe('learncard capabilities', () => {
    it('sets {version, capabilities} for --json', async () => {
        await runCapabilities(undefined, { json: true });
        expect(out.result).toEqual({
            version: packageJson.version,
            capabilities: [...CAPABILITIES],
        });
        expect(JSON.parse(JSON.stringify(out.result))).toEqual(out.result);
    });

    it('<id> narrows to one capability and prints its details', async () => {
        const logs: string[] = [];
        vi.spyOn(console, 'log').mockImplementation((...parts) => {
            logs.push(parts.join(' '));
        });
        await runCapabilities('consentflow');
        expect((out.result.capabilities as { id: string }[]).map(c => c.id)).toEqual([
            'consentflow',
        ]);
        expect(logs.join('\n')).toMatch(/CLI:\s+consent-contract/);
        expect(logs.join('\n')).toContain('https://docs.learncard.com/build/create-a-consentflow');
    });

    it('an unknown id is UNKNOWN_CAPABILITY with suggestions', async () => {
        const error = await runCapabilities('consent-flow').catch(e => e);
        expect(error).toBeInstanceOf(CliError);
        expect(error).toMatchObject({ code: 'UNKNOWN_CAPABILITY' });
        expect(error.hint).toContain('consentflow');
    });

    it('human mode lists every capability and points to --json', async () => {
        const logs: string[] = [];
        vi.spyOn(console, 'log').mockImplementation((...parts) => {
            logs.push(parts.join(' '));
        });
        await runCapabilities(undefined);
        for (const capability of CAPABILITIES)
            expect(logs.some(line => line.startsWith(`${capability.id} `))).toBe(true);
        expect(logs.join('\n')).toContain('npx @learncard/cli capabilities --json');
    });
});
