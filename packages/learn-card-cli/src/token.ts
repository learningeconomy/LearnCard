import fs from 'node:fs/promises';
import path from 'node:path';
import {
    connect,
    ensureIdentity,
    ensureProfile,
    loadProject,
    requireIdentity,
    saveProject,
    type NetworkCard,
    type Project,
    type ProjectOptions,
    localizeSnippet,
    resolveServices,
    withEnvTokenLoader,
} from './project';
import { out } from './out';
import { UsageError } from './errors';

// Route-derived resources documented in auth-grants-and-api-tokens.md (not the stale singular aliases).
export const SCOPE_RESOURCES = [
    'boosts',
    'inbox',
    'credentials',
    'presentations',
    'profiles',
    'profileManagers',
    'connections',
    'contracts',
    'contracts-data',
    'signingAuthorities',
    'authGrants',
    'didMetadata',
    'claimHooks',
    'skills',
    'app-store',
    'integrations',
    'contact-methods',
    'activity',
    'storage',
] as const;

export const validateScope = (scope: string): string => {
    for (const part of scope.trim().split(/\s+/).filter(Boolean)) {
        const [resource, action, extra] = part.split(':');
        if (
            extra !== undefined ||
            !resource ||
            (resource !== '*' && !SCOPE_RESOURCES.some(value => value === resource))
        ) {
            throw new Error(
                `Unknown scope resource in "${part}". Choose: ${SCOPE_RESOURCES.join(', ')}, or *.`
            );
        }
        if (!action || !['read', 'write', 'delete', '*'].includes(action)) {
            throw new Error(`Invalid action in "${part}". Use read, write, delete, or *.`);
        }
    }
    return scope.trim().split(/\s+/).filter(Boolean).join(' ');
};

/** `--expires <days>`: a positive number of days, or undefined for no expiry. */
export const parseExpiresDays = (value: string | undefined): number | undefined => {
    if (value === undefined) return undefined;
    const days = Number(value);
    if (!value.trim() || !Number.isFinite(days) || days <= 0)
        throw new UsageError(`Invalid --expires "${value}". Use a positive number of days.`);
    return days;
};

export type TokenOptions = ProjectOptions & {
    scope?: string;
    revoke?: string;
    expires?: string;
    list?: boolean;
    /** Include the raw API token in `--json` output (and stderr). Off by default. */
    showSecret?: boolean;
};

export const runToken = async (options: TokenOptions): Promise<void> => {
    // Validate every flag before touching .env or the network.
    const scope = validateScope(options.scope ?? 'boosts:write');
    const expiresDays = parseExpiresDays(options.expires);
    const project = await loadProject(process.cwd());
    if (options.list || options.revoke) {
        // Listing and revoking act on an existing identity; never create one (or a profile) here.
        requireIdentity(project);
        const learnCard = await connect(project, { ...options, readOnly: true });
        if (options.list) await listGrants(learnCard);
        else await revokeGrant(learnCard, options.revoke!);
        return;
    }
    const identity = await ensureIdentity(project, { ...options, name: undefined });
    const learnCard = await connect(project, options);
    await ensureProfile(learnCard, identity, project);
    await createToken(project, learnCard, { ...options, scope, expiresDays });
};

type TokenCard = NetworkCard;

/**
 * The `--json` result for a created token. The raw token is omitted unless `showSecret`;
 * `tokenSavedTo` always names the .env file that holds it as `API_TOKEN`.
 */
export const tokenResult = (input: {
    grantId: string;
    scope: string;
    token: string;
    tokenSavedTo: string;
    files: string[];
    showSecret?: boolean;
}): Record<string, unknown> => ({
    grantId: input.grantId,
    scope: input.scope,
    tokenSavedTo: input.tokenSavedTo,
    files: input.files,
    ...(input.showSecret ? { token: input.token } : {}),
});

const listGrants = async (learnCard: TokenCard): Promise<void> => {
    const grants = (await learnCard.invoke.getAuthGrants()) ?? [];
    for (const g of grants)
        out.log(
            `${g.id}  ${(g.status ?? '').padEnd(8)} ${(g.scope ?? '').padEnd(22)} ${g.name ?? ''}${
                g.expiresAt ? `  expires ${g.expiresAt.slice(0, 10)}` : ''
            }`
        );
    if (!grants.length) out.log('No auth grants yet.');
    out.set({
        grants: grants.map(g => ({
            id: g.id,
            name: g.name,
            scope: g.scope,
            status: g.status,
            expiresAt: g.expiresAt,
        })),
    });
};

const revokeGrant = async (learnCard: TokenCard, grantId: string): Promise<void> => {
    if (!(await learnCard.invoke.revokeAuthGrant(grantId)))
        throw new Error('Could not revoke auth grant.');
    out.log(`Revoked auth grant ${grantId}.`);
    out.log('Create a replacement: npx @learncard/cli token');
    out.set({ grantId });
};

const createToken = async (
    project: Project,
    learnCard: TokenCard,
    options: ProjectOptions & { scope: string; expiresDays?: number; showSecret?: boolean }
): Promise<void> => {
    const { scope, expiresDays, showSecret } = options;
    const id = await learnCard.invoke.addAuthGrant({
        name: options.name ?? `cli-${new Date().toISOString().slice(0, 10)}`,
        scope,
        ...(expiresDays !== undefined
            ? { expiresAt: new Date(Date.now() + expiresDays * 86_400_000).toISOString() }
            : {}),
    });
    const token = await learnCard.invoke.getAPITokenForAuthGrant(id);
    // Tighten existing files before writing the bearer credential.
    await fs.chmod(project.envPath, 0o600);
    await saveProject(project, { API_TOKEN: token, API_TOKEN_SCOPE: scope });
    out.log(`Created auth grant ${id}.`);
    // Human mode prints the token once (a person asked for it). In --json mode stdout and stderr
    // are usually captured by a script or agent transcript, so the token stays in .env unless
    // --show-secret is passed.
    const printToken = !out.json || !!showSecret;
    if (printToken) {
        out.log(
            "Warning: this token won't be shown again by this command. It is saved in .env; keep it private."
        );
        out.log(token);
    } else {
        out.log(
            `Token saved to ${project.envPath} as API_TOKEN (not printed; pass --show-secret to include it).`
        );
    }
    const file = path.join(process.cwd(), 'send.sh');
    let wroteSendSh = false;
    // Static import would make org schema validation require this absent-on-clean-checkout asset.
    const { SEND_SH } = await import('./generated/snippets');
    try {
        await fs.writeFile(
            file,
            withEnvTokenLoader(
                localizeSnippet(SEND_SH, resolveServices(project.env, options.network))
            ),
            {
                flag: 'wx',
                mode: 0o700,
            }
        );
        out.log('Wrote ./send.sh');
        wroteSendSh = true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        out.log('Kept existing ./send.sh');
    }
    out.log(
        'Next: save your send payload as request.json, then run sh ./send.sh (example: https://docs.learncard.com/start-here/your-first-integration).'
    );
    out.set(
        tokenResult({
            grantId: id,
            scope,
            token,
            tokenSavedTo: project.envPath,
            files: wroteSendSh ? ['./send.sh'] : [],
            showSecret,
        })
    );
};
