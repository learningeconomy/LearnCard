import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'node:crypto';
import {
    connect,
    connectAsManaged,
    createPrompts,
    ensureIdentity,
    ensureProfile,
    loadProject,
    saveProject,
    type ProjectOptions,
    localizeSnippet,
    resolveServices,
} from './project';
import { setupSigning } from './setup-signing';
import { SEND_MJS, SEND_FROM_TEMPLATE_MJS } from './generated/snippets';
import { out } from './out';

export { SEND_MJS } from './generated/snippets';
export { parseEnv, upsertEnv, toProfileId } from './project';
export type SendEnv = { SECURE_SEED?: string; PROFILE_ID?: string };
export type Badge = { name: string; description: string };
export const DEFAULT_BADGE: Badge = {
    name: 'Quickstart Complete',
    description: 'Sent a verifiable credential with LearnCard.',
};

export const quickstartCredential = (issuerDid: string, badge: Badge = DEFAULT_BADGE) => ({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: issuerDid,
    validFrom: new Date().toISOString(),
    name: badge.name,
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: badge.name,
            description: badge.description,
            criteria: { narrative: 'Ran the LearnCard quickstart.' },
        },
    },
});

export const templateCredential = (issuerDid: string, badge: Badge = DEFAULT_BADGE) => {
    const credential = quickstartCredential(issuerDid, badge);
    credential['@context'].push('https://ctx.learncard.com/boosts/1.0.1.json');
    credential.type.push('BoostCredential');
    return credential;
};

type SendOptions = ProjectOptions & {
    as?: string;
    badge?: string;
    description?: string;
    template?: boolean;
    templateUri?: string;
    webhookUrl?: string;
    suppressDelivery?: boolean;
    guardianEmail?: string;
};

type SendDeliveryOptions = {
    webhookUrl?: string;
    suppressDelivery?: boolean;
    guardianEmail?: string;
};

const sendOptions = (options: SendOptions): { options?: SendDeliveryOptions } => {
    const picked: SendDeliveryOptions = {
        webhookUrl: options.webhookUrl,
        suppressDelivery: options.suppressDelivery,
        guardianEmail: options.guardianEmail,
    };
    return Object.values(picked).some(v => v !== undefined) ? { options: picked } : {};
};

/** Inserts the effective send() delivery options right after `anchor` so a re-run of the
 *  generated script reproduces the same call. */
const withDeliveryOptions = (
    content: string,
    anchor: string,
    deliveryOptions?: SendDeliveryOptions
): string =>
    deliveryOptions
        ? content.replace(
              anchor,
              () => `${anchor}\n    options: ${JSON.stringify(deliveryOptions)},`
          )
        : content;

/** Substitute the user's choices into the template that the docs snippet uses. */
export const personalizeSendMjs = (
    displayName: string,
    badge: Badge,
    deliveryOptions?: SendDeliveryOptions
): string =>
    withDeliveryOptions(
        SEND_MJS.replace(
            "displayName: 'My Organization'",
            () => `displayName: ${JSON.stringify(displayName)}`
        )
            .split("'Quickstart Complete'")
            .join(JSON.stringify(badge.name))
            .replace("'Sent a verifiable credential with LearnCard.'", () =>
                JSON.stringify(badge.description)
            ),
        '    signedCredential: credential,',
        deliveryOptions
    );

/** Substitute the effective send() delivery options into the from-template script. */
export const personalizeSendFromTemplateMjs = (deliveryOptions?: SendDeliveryOptions): string =>
    withDeliveryOptions(
        SEND_FROM_TEMPLATE_MJS,
        '    templateUri: process.env.TEMPLATE_URI,',
        deliveryOptions
    );

/** Bind a generated script to its managed issuer, never the parent seed identity. */
export const withManagedIssuer = (content: string, managedDid: string): string =>
    content
        .replace(
            'const learnCard = await initLearnCard(',
            `if (process.env.MANAGED_DID !== ${JSON.stringify(managedDid)}) {
    throw new Error('MANAGED_DID is missing or changed. Re-run the CLI with --as to send as the intended profile.');
}
const learnCard = await initLearnCard(`
        )
        .replace(
            'seed: process.env.SECURE_SEED,',
            'seed: process.env.SECURE_SEED, didWeb: process.env.MANAGED_DID,'
        )
        .replace(
            /if \(!\(await learnCard\.invoke\.getProfile\(\)\)\) \{[\s\S]*?\n\}/,
            `if (!(await learnCard.invoke.getProfile())) {
    throw new Error('The managed issuer profile could not be found.');
}`
        );

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?\d{10,15}$/;
const DID = /^did:[a-z0-9]+:.+$/;
const PROFILE_ID = /^[a-z0-9-]{3,40}$/;

export type RecipientKind = 'email' | 'phone' | 'did' | 'profileId';

export const classifyRecipient = (value: string): RecipientKind => {
    if (EMAIL.test(value)) return 'email';
    if (PHONE.test(value)) return 'phone';
    if (DID.test(value)) return 'did';
    if (PROFILE_ID.test(value)) return 'profileId';
    throw new Error(
        `"${value}" is not an email, phone number, profile ID, or DID. Example: npx @learncard/cli send you@yourdomain.com`
    );
};

/** Domains reserved for documentation (RFC 2606 / RFC 6761). Mail to them goes nowhere. */
const PLACEHOLDER_DOMAIN = /(^|\.)example\.(com|net|org)$|(^|\.)(example|test|invalid|localhost)$/i;

export const RECIPIENT_PROMPT =
    'Where should we send your first badge? (email, phone number, profile ID, or DID)';

export const isPlaceholderRecipient = (recipient: string): boolean => {
    const at = recipient.lastIndexOf('@');
    return at !== -1 && PLACEHOLDER_DOMAIN.test(recipient.slice(at + 1));
};

/**
 * Returns a human-readable reason `recipient` cannot receive a badge, or `undefined` if it can.
 * Placeholder addresses like you@example.com pass a naive email check but are undeliverable,
 * so they are called out specifically — docs readers paste them verbatim.
 */
export const invalidRecipientReason = (recipient: string): string | undefined => {
    if (!recipient) return 'Enter an email, phone number, profile ID, or DID.';
    if (EMAIL.test(recipient) && isPlaceholderRecipient(recipient))
        return `"${recipient}" is a placeholder address — nobody will receive the badge. Use a real email you can open.`;
    if (
        !EMAIL.test(recipient) &&
        !PHONE.test(recipient) &&
        !DID.test(recipient) &&
        !PROFILE_ID.test(recipient)
    )
        return `"${recipient}" is not an email, phone number, profile ID, or DID.`;
    return undefined;
};

type Prompts = ReturnType<typeof createPrompts>;

/**
 * Settle on a deliverable recipient. When a human is at the terminal, bad or missing input
 * re-prompts instead of failing; non-interactive runs throw a clear error.
 */
export const resolveRecipient = async (
    recipient: string | undefined,
    prompts: Prompts
): Promise<string> => {
    let candidate = recipient?.trim() ?? '';
    if (!candidate && !prompts.interactive)
        throw new Error(
            'A recipient is required when running non-interactively. Example: npx @learncard/cli send you@yourdomain.com --yes'
        );
    if (!candidate) candidate = (await prompts.ask(RECIPIENT_PROMPT, '')).trim();
    let reason = invalidRecipientReason(candidate);
    while (reason) {
        if (!prompts.interactive)
            throw new Error(`${reason} Example: npx @learncard/cli send you@yourdomain.com`);
        out.log(reason);
        candidate = (await prompts.ask(RECIPIENT_PROMPT, '')).trim();
        reason = invalidRecipientReason(candidate);
    }
    return candidate;
};

export const runSend = async (
    recipient: string | undefined,
    options: SendOptions
): Promise<void> => {
    const cwd = process.cwd();
    const project = await loadProject(cwd);
    const prompts = createPrompts(options.yes);
    let resolvedRecipient: string;
    let displayName: string | undefined;
    let badge: Badge;
    try {
        resolvedRecipient = await resolveRecipient(recipient, prompts);
        const needsName = !project.env.PROFILE_ID && !options.profileId && !options.name;
        displayName = needsName
            ? await prompts.ask('Display name for your issuer profile', 'My Organization')
            : options.name;
        badge = {
            name: options.badge ?? (await prompts.ask('Badge name', DEFAULT_BADGE.name)),
            description: options.description ?? DEFAULT_BADGE.description,
        };
    } finally {
        prompts.close();
    }
    const recipientKind = classifyRecipient(resolvedRecipient);
    const identity = await ensureIdentity(project, { ...options, name: displayName, yes: true });
    const asManaged = options.as ? await connectAsManaged(project, options, options.as) : undefined;
    const hostedSigning = !!project.env.SIGNING_AUTHORITY_NAME;
    const explicitTemplate = options.templateUri ? true : options.template;
    const useTemplate = !asManaged && (explicitTemplate ?? hostedSigning);
    if (useTemplate && explicitTemplate === undefined) {
        out.log(
            `Signing through the registered signing authority "${project.env.SIGNING_AUTHORITY_NAME}" (pass --no-template to sign with the local key instead).`
        );
    }
    if (asManaged && explicitTemplate) {
        out.log("--as signs with the managed profile's key; --template is ignored.");
    }
    const learnCard = asManaged
        ? asManaged
        : useTemplate
          ? await connect(project, { ...options, lca: true })
          : await connect(project, options);
    if (asManaged) {
        const managed = await learnCard.invoke.getProfile();
        if (!managed) throw new Error(`Could not sign in as managed profile "${options.as}".`);
        out.log(
            `Acting as "${managed.displayName}" (${managed.profileId}) — a profile you manage.`
        );
    } else {
        await ensureProfile(learnCard, identity, project);
    }

    const effectiveSendOptions = sendOptions(options);
    let result;
    if (useTemplate) {
        // This branch connected with the LCA plugin; setupSigning accepts its required methods.
        await setupSigning(
            project,
            learnCard as Awaited<
                ReturnType<typeof import('@learncard/lca-api-plugin').initLCALearnCard>
            >
        );
        if (options.templateUri) {
            out.log(`Sending from template ${options.templateUri}.`);
            if (!project.env.TEMPLATE_URI) {
                await saveProject(project, { TEMPLATE_URI: options.templateUri });
            }
        } else if (!project.env.TEMPLATE_URI) {
            const uri = await learnCard.invoke.createBoost(
                templateCredential(learnCard.id.did(), badge),
                {
                    name: badge.name,
                    category: 'Achievement',
                    status: 'LIVE',
                }
            );
            await saveProject(project, { TEMPLATE_URI: uri });
        } else {
            out.log(
                `Reusing template ${project.env.TEMPLATE_URI}; its saved badge name and description are unchanged.`
            );
        }
        result = await learnCard.invoke.send({
            type: 'boost',
            recipient: resolvedRecipient,
            templateUri: options.templateUri ?? project.env.TEMPLATE_URI!,
            ...effectiveSendOptions,
        });
    } else {
        const credential = await learnCard.invoke.issueCredential(
            quickstartCredential(learnCard.id.did(), badge)
        );
        result = await learnCard.invoke.send({
            type: 'boost',
            recipient: resolvedRecipient,
            signedCredential: credential,
            ...effectiveSendOptions,
        });
    }
    out.log('');
    if (result.inbox?.status === 'PENDING') {
        out.log(
            `Sent. ${resolvedRecipient} will get a claim ${recipientKind === 'phone' ? 'text' : 'email'}. You can also share this link directly:\n${result.inbox.claimUrl}`
        );
    } else if (recipientKind === 'email' || recipientKind === 'phone') {
        out.log(
            `Delivered. ${resolvedRecipient} already uses LearnCard — the credential is in their wallet.`
        );
    } else {
        out.log(
            `Delivered directly to ${resolvedRecipient} — it is waiting in their LearnCard wallet.`
        );
    }
    out.log(`Reusable template for this badge: ${result.uri}`);
    const filename = useTemplate ? 'send-from-template.mjs' : 'send.mjs';
    const sendPath = path.join(cwd, filename);
    let wroteSendFile = false;
    if (!(await fs.stat(sendPath).catch(() => null))) {
        let content = useTemplate
            ? personalizeSendFromTemplateMjs(effectiveSendOptions.options)
            : personalizeSendMjs(identity.displayName, badge, effectiveSendOptions.options);
        content = localizeSnippet(content, resolveServices(project.env, options.network));
        if (asManaged) {
            const managedDid = learnCard.id.did();
            await saveProject(project, { MANAGED_DID: managedDid });
            content = withManagedIssuer(content, managedDid);
        }
        await fs.writeFile(sendPath, content);
        wroteSendFile = true;
        out.log(
            `\nThe code that just ran is in ./${filename} — run it yourself:\n  npm install @learncard/init\n  node --env-file=.env ${filename} ${resolvedRecipient}`
        );
    } else if (asManaged) {
        out.log(
            `Existing ./${filename} was not changed and may use a different issuer. Repeat this send with the CLI --as ${options.as} instead.`
        );
    }
    out.log(`Check whether it was claimed: npx @learncard/cli status ${result.activityId}`);
    out.log(`See it in the app: npx @learncard/cli open${options.template ? ' template' : ''}`);
    out.set({
        profileId: options.as ?? identity.profileId,
        ...(options.as && { onBehalfOf: identity.profileId }),
        did: learnCard.id.did(),
        recipient: resolvedRecipient,
        recipientKind,
        status: result.inbox?.status === 'PENDING' ? 'PENDING' : 'ISSUED',
        ...(result.inbox?.claimUrl && { claimUrl: result.inbox.claimUrl }),
        templateUri: result.uri,
        activityId: result.activityId,
        ...(result.credentialUri && { credentialUri: result.credentialUri }),
        ...(result.inbox?.issuanceId && { issuanceId: result.inbox.issuanceId }),
        files: wroteSendFile ? [`./${filename}`] : [],
    });
};
