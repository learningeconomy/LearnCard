#!/usr/bin/env bun
/**
 * ClassLink data maintenance. Dry run unless `--apply`.
 *
 *   bun scripts/cleanup-orphan-classlink-data.ts [--apply]
 *       Clear expired (or legacy plaintext) state student IDs. lca-api also does this
 *       automatically (throttled) on sign-in and transcript requests; this is a backstop.
 *
 *   bun scripts/cleanup-orphan-classlink-data.ts --delete-orphans [--min-age-days 30] [--apply]
 *       Additionally delete ClassLink identities (with their `classlink:` AuthSubject) and
 *       transcript requests that no account owns any more (no UserKey by Firebase uid,
 *       Keycloak subject or recorded DID) and that have had no activity for --min-age-days.
 *       Every sign-in updates the identity, so a student who signed in recently but hasn't
 *       finished wallet setup is never deleted.
 *
 * Always exits: the Mongo and Redis connections are closed and the process exits with 0
 * (or 1 on failure).
 */
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import {
    cleanupOrphanClassLinkData,
    clearExpiredClassLinkStateIds,
    DEFAULT_ORPHAN_MIN_AGE_DAYS,
} from '../src/helpers/classlinkCleanup.helpers';

export interface CleanupArgs {
    apply: boolean;
    deleteOrphans: boolean;
    minAgeDays: number;
}

/** Parse command-line flags; throws on unknown flags or an invalid --min-age-days. */
export const parseCleanupArgs = (argv: string[]): CleanupArgs => {
    const { values } = parseArgs({
        args: argv.filter(arg => arg !== '--'),
        options: {
            apply: { type: 'boolean', default: false },
            'delete-orphans': { type: 'boolean', default: false },
            'min-age-days': { type: 'string' },
        },
        strict: true,
    });
    const minAgeDays =
        values['min-age-days'] === undefined
            ? DEFAULT_ORPHAN_MIN_AGE_DAYS
            : Number(values['min-age-days']);
    if (!Number.isInteger(minAgeDays) || minAgeDays < 1)
        throw new Error('--min-age-days must be a positive whole number');
    return {
        apply: values.apply ?? false,
        deleteOrphans: values['delete-orphans'] ?? false,
        minAgeDays,
    };
};

/** Run the selected maintenance and return a one-line summary. */
export const runClassLinkCleanup = async (args: CleanupArgs): Promise<string> => {
    const cleared = await clearExpiredClassLinkStateIds(args.apply);
    const deleted = args.deleteOrphans
        ? await cleanupOrphanClassLinkData({ apply: args.apply, minAgeDays: args.minAgeDays })
        : 0;
    return `mode=${args.apply ? 'apply' : 'dry-run'} stateIdsCleared=${cleared}${
        args.deleteOrphans ? ` orphansDeleted=${deleted} minAgeDays=${args.minAgeDays}` : ''
    }`;
};

const closeConnections = async (): Promise<void> => {
    const [{ client }, { default: cache }] = await Promise.all([
        import('../src/mongo'),
        import('../src/cache'),
    ]);
    await Promise.allSettled([client.close(), cache.redis?.quit(), cache.node?.quit()]);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    let exitCode = 0;
    try {
        console.log(await runClassLinkCleanup(parseCleanupArgs(process.argv.slice(2))));
    } catch (error) {
        // Argument errors are safe to echo; driver errors can embed connection strings, so
        // only their type is printed.
        const code = (error as { code?: unknown }).code;
        const isArgumentError =
            error instanceof Error &&
            ((typeof code === 'string' && code.startsWith('ERR_PARSE_ARGS')) ||
                error.message.startsWith('--'));
        console.error(
            `cleanup-orphan-classlink-data failed: ${
                isArgumentError ? error.message : error instanceof Error ? error.name : typeof error
            }`
        );
        exitCode = 1;
    } finally {
        await closeConnections().catch(() => undefined);
        process.exit(exitCode);
    }
}
