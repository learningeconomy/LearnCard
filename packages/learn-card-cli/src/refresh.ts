import type { Command } from 'commander';
import type { CredentialRefreshVersionMetadata } from '@learncard/types';

import { connect, loadProject, resolveServices, type ProjectOptions } from './project';
import { out } from './out';
import { parseLimit } from './inbox';

export type RefreshHistoryOptions = ProjectOptions & { limit?: string };

/** One human-readable line per published version: `version  publishedAt  summary`. */
export const formatRefreshVersion = (record: CredentialRefreshVersionMetadata): string =>
    `${String(record.version).padEnd(7)} ${record.publishedAt}  ${record.updateSummary ?? ''}`.trimEnd();

const NOT_AVAILABLE_PATTERN = /credential refresh is not available/i;

/** Rewrites the network's generic "not available" failure into an actionable message. */
export const mapRefreshHistoryError = (error: unknown, network: string): Error => {
    const message = error instanceof Error ? error.message : String(error);
    if (NOT_AVAILABLE_PATTERN.test(message)) {
        return new Error(
            `Credential refresh isn't enabled on this network (${network}). Use --network staging or ask LearnCard to enable it.`
        );
    }
    return error instanceof Error ? error : new Error(message);
};

export const runRefreshHistory = async (
    refreshId: string,
    options: RefreshHistoryOptions
): Promise<void> => {
    const limit = options.limit === undefined ? undefined : parseLimit(options.limit);
    const project = await loadProject(process.cwd());
    const services = resolveServices(project.env, options.network);
    const learnCard = await connect(project, options);

    let records: CredentialRefreshVersionMetadata[];
    let hasMore: boolean;
    try {
        const result = await learnCard.invoke.getCredentialRefreshHistory({
            refreshId,
            ...(limit !== undefined ? { limit } : {}),
        });
        records = result.records;
        hasMore = result.hasMore;
    } catch (error) {
        throw mapRefreshHistoryError(error, services.network);
    }

    if (!records.length) {
        out.log(`No published versions found for ${refreshId}.`);
        out.set({ refreshId, versions: [], hasMore });
        return;
    }

    out.log('version  publishedAt  summary');
    for (const record of records) out.log(formatRefreshVersion(record));
    if (hasMore) out.log('…more. Raise --limit to see additional versions.');

    out.set({
        refreshId,
        versions: records.map(record => ({
            version: record.version,
            publishedAt: record.publishedAt,
            updateSummary: record.updateSummary,
        })),
        hasMore,
    });
};

export const registerRefreshCommand = (
    program: Command,
    run: (
        command: string,
        options: { json?: boolean },
        action: (didkit: Promise<Buffer>) => Promise<void>,
        wrap?: boolean
    ) => Promise<void>
): void => {
    const refresh = program
        .command('refresh')
        .description('Managed credential refresh: audit published versions of a transcript.');
    refresh
        .command('history <refreshId>')
        .description('List the published version history for a managed refresh.')
        .option('--limit <n>', 'how many versions to list')
        .option('--network <url>', 'network tRPC URL or staging (default: production)')
        .option('--json', 'print a single JSON result on stdout')
        .action((refreshId, options) =>
            run('refresh history', options, async didkit => {
                await runRefreshHistory(refreshId, { ...options, didkit });
            })
        );
};
