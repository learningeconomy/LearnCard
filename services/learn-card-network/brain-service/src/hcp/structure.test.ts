/**
 * Enforces the HCP coupling rule (see v1/README.md "Coupling"):
 *  - only `src/app.ts` (the router) and the profile delete (the subject-data
 *    cascade) import `src/hcp`, and only its index;
 *  - nothing outside `src/hcp` imports a version folder;
 *  - inside a version, brain internals are imported only by its ports, its Neo4j
 *    adapter (`@instance`) and its router (`@routes` for tRPC builders).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '..');
const HCP = resolve(__dirname);

const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap(name => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return walk(path);
        return /\.tsx?$/.test(name) ? [path] : [];
    });

const IMPORT =
    /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

const importsOf = (file: string): string[] =>
    [...readFileSync(file, 'utf8').matchAll(IMPORT)].map(match => (match[1] ?? match[2])!);

const BRAIN_ALIASES =
    /^(@accesslayer|@cache|@environment|@helpers|@instance|@models|@routes|@services|@tracing|src\/|types\/)/;

/** Where an import lands inside `src`, or null for packages. */
const target = (file: string, specifier: string): string | null => {
    if (specifier.startsWith('.')) return resolve(dirname(file), specifier);
    if (specifier.startsWith('src/')) return resolve(SRC, specifier.slice(4));
    return null;
};

/** Files outside `src/hcp` that may import its index, and nothing deeper. */
const ROOT_IMPORTERS = new Set(['app.ts', 'accesslayer/profile/delete.ts']);

const inside = (path: string, dir: string): boolean => !relative(dir, path).startsWith('..');

/** Allowed brain-internal imports per file, relative to a version folder. */
const ALLOWED_INTERNAL: Record<string, RegExp> = {
    'ports.ts': BRAIN_ALIASES,
    'router.ts': /^@routes$/,
    'store/neo4j.ts': /^@instance$/,
};

describe('HCP module coupling', () => {
    const srcFiles = walk(SRC);
    const versions = readdirSync(HCP).filter(name => statSync(join(HCP, name)).isDirectory());

    it('has at least one version folder', () => {
        expect(versions).toContain('v1');
    });

    it('is imported only by app.ts and the profile delete, and only through its index', () => {
        const violations = srcFiles
            .filter(file => !inside(file, HCP))
            .flatMap(file =>
                importsOf(file)
                    .map(specifier => ({ specifier, to: target(file, specifier) }))
                    .filter(({ to }) => to !== null && inside(to, HCP))
                    .filter(
                        ({ to }) => !ROOT_IMPORTERS.has(relative(SRC, file)) || resolve(to!) !== HCP
                    )
                    .map(({ specifier }) => `${relative(SRC, file)} -> ${specifier}`)
            );
        expect(violations).toEqual([]);
    });

    it.each(['v1'])(
        '%s reaches brain internals only through its ports, adapter and router',
        version => {
            const root = join(HCP, version);
            const violations = walk(root).flatMap(file => {
                const local = relative(root, file);
                return importsOf(file)
                    .filter(specifier => {
                        const to = target(file, specifier);
                        const escapes = to !== null && !inside(to, root);
                        const aliased = BRAIN_ALIASES.test(specifier);
                        if (!escapes && !aliased) return false;
                        return !(ALLOWED_INTERNAL[local]?.test(specifier) ?? false);
                    })
                    .map(specifier => `${version}/${local} -> ${specifier}`);
            });
            expect(violations).toEqual([]);
        }
    );

    it('keeps versions independent of each other', () => {
        const violations = versions.flatMap(version =>
            walk(join(HCP, version)).flatMap(file =>
                importsOf(file)
                    .map(specifier => target(file, specifier))
                    .filter((to): to is string => to !== null && inside(to, HCP))
                    .filter(to => !inside(to, join(HCP, version)))
                    .map(to => `${relative(HCP, file)} -> ${relative(HCP, to)}`)
            )
        );
        expect(violations).toEqual([]);
    });
});
