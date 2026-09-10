import { connect, ensureIdentity, loadProject, type ProjectOptions } from './project';

export interface RevokeOptions extends ProjectOptions {
    suspend?: boolean;
    templateUri?: string;
    recipient?: string;
}

/** Template URI comes from the credential's `boostId`; the recipient from the network's recipient list. */
export const templateUriOf = (credential: unknown, options: RevokeOptions): string => {
    const value =
        credential && typeof credential === 'object' ? (credential as Record<string, unknown>) : {};
    const templateUri =
        options.templateUri || (typeof value.boostId === 'string' ? value.boostId : undefined);
    if (!templateUri)
        throw new Error(
            'This credential was not issued from a template. Pass --template-uri <uri> and --recipient <profileId>.'
        );
    return templateUri;
};

type Recipient = { to: { profileId: string }; uri?: string };

/** Find which recipient of a template holds this exact credential URI. */
export const recipientOf = (records: Recipient[], credentialUri: string): string | undefined =>
    records.find(record => record.uri === credentialUri)?.to.profileId;

export const runRevoke = async (uri: string, options: RevokeOptions): Promise<void> => {
    const project = await loadProject(process.cwd());
    await ensureIdentity(project, options);
    const learnCard = await connect(project, options);
    const credential =
        options.templateUri && options.recipient ? undefined : await learnCard.read.get(uri);
    const templateUri = templateUriOf(credential, options);
    let profileId = options.recipient;
    let cursor: string | undefined;
    while (!profileId) {
        const page = await learnCard.invoke.getPaginatedBoostRecipients(
            templateUri,
            100,
            cursor,
            true
        );
        profileId = recipientOf(page.records, uri);
        if (profileId || !page.hasMore) break;
        cursor = page.cursor ?? undefined;
    }
    if (!profileId)
        throw new Error(
            `No recipient of ${templateUri} holds ${uri}. If it was sent to an email and not yet claimed, there is nothing to revoke; otherwise pass --recipient <profileId>.`
        );
    const target = { templateUri, profileId };
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
