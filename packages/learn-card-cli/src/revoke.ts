import { connect, ensureIdentity, loadProject, type ProjectOptions } from './project';

export interface RevokeOptions extends ProjectOptions {
    suspend?: boolean;
    templateUri?: string;
    recipient?: string;
}

/** Boosts contain their template URI and a single recipient's network DID. */
export const revocationTarget = (credential: unknown, options: RevokeOptions) => {
    const value =
        credential && typeof credential === 'object' ? (credential as Record<string, unknown>) : {};
    const templateUri =
        options.templateUri || (typeof value.boostId === 'string' ? value.boostId : undefined);
    const subjects = Array.isArray(value.credentialSubject)
        ? value.credentialSubject
        : [value.credentialSubject];
    const subject =
        subjects.length === 1 ? (subjects[0] as { id?: unknown } | undefined) : undefined;
    const did = typeof subject?.id === 'string' ? subject.id : '';
    const profileId =
        options.recipient ||
        (did.startsWith('did:web:') ? did.match(/:users:([^:]+)$/)?.[1] : undefined);
    if (!templateUri || !profileId)
        throw new Error(
            'Cannot resolve the template and recipient. Pass --template-uri <uri> and --recipient <profileId> (not an email).'
        );
    return { templateUri, profileId };
};

export const runRevoke = async (uri: string, options: RevokeOptions): Promise<void> => {
    const project = await loadProject(process.cwd());
    await ensureIdentity(project, options);
    const learnCard = await connect(project, options);
    const credential =
        options.templateUri && options.recipient ? undefined : await learnCard.read.get(uri);
    const target = revocationTarget(credential, options);
    const result = options.suspend
        ? await learnCard.invoke.suspendBoostRecipient(target.templateUri, target.profileId, uri)
        : await learnCard.invoke.revokeBoostRecipient(target.templateUri, target.profileId, uri);
    if (!result) throw new Error('The network did not update this credential.');
    const status = options.suspend ? 'suspended' : 'revoked';
    console.log(
        `${options.suspend ? 'Suspended' : 'Revoked'} ${uri}. Verifiers will see status: ${status} when they next refresh its status list; no propagation interval is documented.`
    );
    console.log('Only credentials with a credentialStatus entry support status-list verification.');
    console.log('Check the delivered JSON: npx @learncard/cli verify credential.json');
};
