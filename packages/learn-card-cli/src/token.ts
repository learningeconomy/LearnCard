import fs from 'node:fs/promises';
import path from 'node:path';
import {
    connect,
    ensureIdentity,
    ensureProfile,
    loadProject,
    saveProject,
    type ProjectOptions,
    localizeSnippet,
    resolveServices,
    withEnvTokenLoader,
} from './project';
import { SEND_SH } from './generated/snippets';
import { out } from './out';

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

export const runToken = async (
    options: ProjectOptions & { scope?: string; revoke?: string }
): Promise<void> => {
    const scope = validateScope(options.scope ?? 'boosts:write');
    const project = await loadProject(process.cwd());
    const identity = await ensureIdentity(project, { ...options, name: undefined });
    const learnCard = await connect(project, options);
    await ensureProfile(learnCard, identity);
    if (options.revoke) {
        if (!(await learnCard.invoke.revokeAuthGrant(options.revoke)))
            throw new Error('Could not revoke auth grant.');
        out.log(`Revoked auth grant ${options.revoke}.`);
        out.log('Create a replacement: npx @learncard/cli token');
        out.set({ grantId: options.revoke });
        return;
    }
    const id = await learnCard.invoke.addAuthGrant({
        name: options.name ?? `cli-${new Date().toISOString().slice(0, 10)}`,
        scope,
    });
    const token = await learnCard.invoke.getAPITokenForAuthGrant(id);
    // Tighten existing files before writing the bearer credential.
    await fs.chmod(project.envPath, 0o600);
    await saveProject(project, { API_TOKEN: token, API_TOKEN_SCOPE: scope });
    out.log(`Created auth grant ${id}.`);
    out.log(
        "Warning: this token won't be shown again by this command. It is saved in .env; keep it private."
    );
    out.log(token);
    const file = path.join(process.cwd(), 'send.sh');
    let wroteSendSh = false;
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
    out.set({ grantId: id, scope, token, files: wroteSendSh ? ['./send.sh'] : [] });
};
