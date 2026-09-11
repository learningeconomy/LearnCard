import type { LCALearnCard } from '@learncard/lca-api-plugin';
import {
    connect,
    ensureIdentity,
    ensureProfile,
    loadProject,
    saveProject,
    type Project,
    type ProjectOptions,
} from './project';
import { out } from './out';

export const authorityName = (project: Project, name?: string): string =>
    name ?? project.env.SIGNING_AUTHORITY_NAME ?? 'default-issuer';

export interface SigningAuthorityResult {
    name: string;
    endpoint: string;
    did: string;
    alreadyConfigured: boolean;
}

type SigningCard = {
    invoke: Pick<
        LCALearnCard['invoke'],
        | 'getRegisteredSigningAuthorities'
        | 'getSigningAuthorities'
        | 'setPrimaryRegisteredSigningAuthority'
        | 'createSigningAuthority'
        | 'registerSigningAuthority'
    >;
};

/** Create and register a hosted signer once; also repair a changed primary selection. */
export const setupSigning = async (
    project: Project,
    learnCard: SigningCard,
    requestedName?: string,
    options: { persist?: boolean } = {}
): Promise<SigningAuthorityResult> => {
    const name = authorityName(project, requestedName);
    const registered = (await learnCard.invoke.getRegisteredSigningAuthorities()).find(
        authority =>
            authority.relationship.name === name &&
            (requestedName ||
                !project.env.SIGNING_AUTHORITY_ENDPOINT ||
                authority.signingAuthority.endpoint === project.env.SIGNING_AUTHORITY_ENDPOINT)
    );
    if (registered) {
        const endpoint = registered.signingAuthority.endpoint;
        if (!registered.relationship.isPrimary) {
            if (!(await learnCard.invoke.setPrimaryRegisteredSigningAuthority(endpoint, name))) {
                throw new Error(
                    'Could not select the primary signing authority. Please try again.'
                );
            }
        }
        if (options.persist !== false) {
            await saveProject(project, {
                SIGNING_AUTHORITY_NAME: name,
                SIGNING_AUTHORITY_ENDPOINT: endpoint,
            });
        }
        out.log(`Signing authority "${name}" is already your primary.`);
        return { name, endpoint, did: registered.relationship.did, alreadyConfigured: true };
    }
    const hosted = await learnCard.invoke.getSigningAuthorities();
    if (!hosted) throw new Error('Could not look up hosted signing authorities. Please try again.');
    const existing = hosted.find(authority => authority.name === name);
    const authority = existing || (await learnCard.invoke.createSigningAuthority(name));
    if (!authority || !authority.endpoint || !authority.did)
        throw new Error('Could not create signing authority. Please try again.');
    const registeredSuccessfully = await learnCard.invoke.registerSigningAuthority(
        authority.endpoint,
        authority.name,
        authority.did
    );
    if (!registeredSuccessfully)
        throw new Error('Could not register signing authority. Please try again.');
    if (
        !(await learnCard.invoke.setPrimaryRegisteredSigningAuthority(
            authority.endpoint,
            authority.name
        ))
    ) {
        throw new Error('Could not select the primary signing authority. Please try again.');
    }
    if (options.persist !== false) {
        await saveProject(project, {
            SIGNING_AUTHORITY_NAME: authority.name,
            SIGNING_AUTHORITY_ENDPOINT: authority.endpoint,
        });
    }
    out.log(`LearnCard will now sign credentials for ${project.env.PROFILE_ID}.`);
    out.log('What this did:');
    out.log(
        existing
            ? `  const authority = (await learnCard.invoke.getSigningAuthorities()).find(authority => authority.name === ${JSON.stringify(name)});`
            : `  const authority = await learnCard.invoke.createSigningAuthority(${JSON.stringify(name)});`
    );
    out.log(
        '  await learnCard.invoke.registerSigningAuthority(authority.endpoint, authority.name, authority.did);'
    );
    out.log(
        '  await learnCard.invoke.setPrimaryRegisteredSigningAuthority(authority.endpoint, authority.name);'
    );
    return {
        name: authority.name,
        endpoint: authority.endpoint,
        did: authority.did,
        alreadyConfigured: false,
    };
};

export const runSetupSigning = async (options: ProjectOptions): Promise<void> => {
    const project = await loadProject(process.cwd());
    const identity = await ensureIdentity(project, { ...options, name: undefined });
    const learnCard = await connect(project, { ...options, lca: true });
    await ensureProfile(learnCard, identity);
    const authority = await setupSigning(project, learnCard, options.name);
    out.set({
        profileId: identity.profileId,
        signingAuthority: {
            name: authority.name,
            endpoint: authority.endpoint,
            did: authority.did,
        },
        alreadyConfigured: authority.alreadyConfigured,
    });
    out.log(
        'Send from a template: npx @learncard/cli send you@example.com --template\nSee it in the app: npx @learncard/cli open'
    );
};
