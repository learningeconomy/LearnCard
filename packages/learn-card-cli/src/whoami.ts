import type { Command } from 'commander';
import type { AuthGrantType } from '@learncard/types';

import {
    connect,
    connectAsDidWeb,
    loadProject,
    resolveServices,
    type ProjectOptions,
} from './project';
import { out } from './out';
import type { RunCommand } from './doctor';
import { describeActAs, getGrantActAs } from './auth-grant';

export interface ManagedSummary {
    profileId: string;
    displayName: string;
    did: string;
}

export interface ServiceAccountSummary {
    name: string;
    scope: string;
    actAs?: string;
}

/** Only active grants are relevant here; revoked ones are noise for this summary. */
export const summarizeServiceAccounts = (
    grants: Array<Partial<AuthGrantType>>
): ServiceAccountSummary[] =>
    grants
        .filter(grant => grant.status === 'active')
        .map(grant => ({
            name: grant.name ?? '',
            scope: grant.scope ?? '',
            actAs: getGrantActAs(grant),
        }));

export const runWhoami = async (options: ProjectOptions): Promise<void> => {
    const project = await loadProject(process.cwd());
    if (!project.env.SECURE_SEED) {
        throw new Error(
            'No identity in this folder. Run `npx @learncard/cli send you@example.com` or `org apply` first.'
        );
    }
    const services = resolveServices(project.env, options.network);
    const learnCard = await connect(project, options);
    const profile = await learnCard.invoke.getProfile();

    out.log(
        profile
            ? `You are "${profile.displayName}" (${profile.profileId}) on ${services.network}`
            : `Seed present but no profile on ${services.network} yet (PROFILE_ID=${project.env.PROFILE_ID ?? '?'}).`
    );
    out.log(`  did: ${learnCard.id.did()}`);
    if (project.env.SIGNING_AUTHORITY_NAME)
        out.log(`  signing authority: ${project.env.SIGNING_AUTHORITY_NAME}`);

    const managerDid = project.env.ORG_PROFILE_MANAGER_DID;
    const managed: ManagedSummary[] = [];
    if (managerDid) {
        const manager = await connectAsDidWeb(project, options, managerDid);
        let cursor: string | undefined;
        do {
            const page = await manager.invoke.getManagedProfiles({ limit: 100, cursor });
            for (const record of page.records) {
                managed.push({
                    profileId: record.profileId,
                    displayName: record.displayName,
                    did: record.did,
                });
            }
            cursor = page.hasMore ? (page.cursor ?? undefined) : undefined;
        } while (cursor);

        out.log(`  manager: ${managerDid}`);
        if (managed.length) {
            out.log('You can act as (--as <profileId> or LEARNCARD_AS=<profileId>):');
            for (const entry of managed)
                out.log(`  ${entry.profileId.padEnd(24)} ${entry.displayName}`);
        } else {
            out.log(
                '  no managed profiles yet — add them under profileManager.managed and run `org apply`.'
            );
        }
    }

    const grants = profile ? ((await learnCard.invoke.getAuthGrants()) ?? []) : [];
    const serviceAccounts = summarizeServiceAccounts(grants);
    if (serviceAccounts.length) {
        out.log('Service accounts:');
        const nameWidth = Math.max(...serviceAccounts.map(entry => entry.name.length));
        const scopeWidth = Math.max(...serviceAccounts.map(entry => entry.scope.length));
        for (const entry of serviceAccounts)
            out.log(
                `  ${entry.name.padEnd(nameWidth)}  ${entry.scope.padEnd(scopeWidth)}  ${describeActAs(entry.actAs)}`
            );
    }

    if (process.env.LEARNCARD_AS)
        out.log(
            `LEARNCARD_AS is set: commands that support --as will act as "${process.env.LEARNCARD_AS}".`
        );

    out.set({
        network: services.network,
        profileId: profile?.profileId ?? project.env.PROFILE_ID,
        displayName: profile?.displayName,
        did: learnCard.id.did(),
        signingAuthority: project.env.SIGNING_AUTHORITY_NAME,
        managerDid,
        managed,
        serviceAccounts,
        actingAs: process.env.LEARNCARD_AS,
    });
};

export const registerWhoamiCommand = (program: Command, run: RunCommand): void => {
    program
        .command('whoami')
        .description('Show the identity in this folder and the managed profiles --as can target.')
        .option('--network <url>', 'network tRPC URL or staging (default: production)')
        .option('--json', 'print a single JSON result on stdout')
        .action(options =>
            run('whoami', options, async didkit => {
                await runWhoami({ ...options, didkit });
            })
        );
};
