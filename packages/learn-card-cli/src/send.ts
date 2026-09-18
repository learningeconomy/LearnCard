import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'node:crypto';
import {
    connect,
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?\d{10,15}$/;
/** Domains reserved for documentation (RFC 2606 / RFC 6761). Mail to them goes nowhere. */
const PLACEHOLDER_DOMAIN = /(^|\.)example\.(com|net|org)$|(^|\.)(example|test|invalid|localhost)$/i;

export const RECIPIENT_PROMPT = 'Where should we send your first badge? (your email or phone)';

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
    if (!recipient) return 'Enter an email address or phone number.';
    if (isPlaceholderRecipient(recipient))
        return `"${recipient}" is a placeholder address — nobody will receive the badge. Use a real email you can open.`;
    if (!EMAIL.test(recipient) && !PHONE.test(recipient))
        return `"${recipient}" is not an email address or phone number.`;
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
    let recipientEmail: string;
    let displayName: string | undefined;
    let badge: Badge;
    try {
        recipientEmail = await resolveRecipient(recipient, prompts);
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
    const identity = await ensureIdentity(project, { ...options, name: displayName, yes: true });
    const useTemplate = options.template || !!options.templateUri;
    const learnCard = useTemplate
        ? await connect(project, { ...options, lca: true })
        : await connect(project, options);
    await ensureProfile(learnCard, identity, project);

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
            recipient: recipientEmail,
            templateUri: options.templateUri ?? project.env.TEMPLATE_URI!,
            ...effectiveSendOptions,
        });
    } else {
        const credential = await learnCard.invoke.issueCredential(
            quickstartCredential(learnCard.id.did(), badge)
        );
        result = await learnCard.invoke.send({
            type: 'boost',
            recipient: recipientEmail,
            signedCredential: credential,
            ...effectiveSendOptions,
        });
    }
    out.log('');
    if (result.inbox?.status === 'PENDING') {
        out.log(
            `Sent. ${recipientEmail} will get a claim email. You can also share this link directly:\n${result.inbox.claimUrl}`
        );
    } else {
        out.log(
            `Delivered. ${recipientEmail} already uses LearnCard — the credential is in their wallet.`
        );
    }
    out.log(`Reusable template for this badge: ${result.uri}`);
    const filename = useTemplate ? 'send-from-template.mjs' : 'send.mjs';
    const sendPath = path.join(cwd, filename);
    let wroteSendFile = false;
    if (!(await fs.stat(sendPath).catch(() => null))) {
        await fs.writeFile(
            sendPath,
            localizeSnippet(
                useTemplate
                    ? personalizeSendFromTemplateMjs(effectiveSendOptions.options)
                    : personalizeSendMjs(identity.displayName, badge, effectiveSendOptions.options),
                resolveServices(project.env, options.network)
            )
        );
        wroteSendFile = true;
        out.log(
            `\nThe code that just ran is in ./${filename} — run it yourself:\n  npm install @learncard/init\n  node --env-file=.env ${filename} ${recipientEmail}`
        );
    }
    out.log(`Check whether it was claimed: npx @learncard/cli status ${result.activityId}`);
    out.log(`See it in the app: npx @learncard/cli open${options.template ? ' template' : ''}`);
    out.set({
        profileId: identity.profileId,
        did: learnCard.id.did(),
        recipient: recipientEmail,
        status: result.inbox?.status === 'PENDING' ? 'PENDING' : 'ISSUED',
        ...(result.inbox?.claimUrl && { claimUrl: result.inbox.claimUrl }),
        templateUri: result.uri,
        activityId: result.activityId,
        ...(result.credentialUri && { credentialUri: result.credentialUri }),
        ...(result.inbox?.issuanceId && { issuanceId: result.inbox.issuanceId }),
        files: wroteSendFile ? [`./${filename}`] : [],
    });
};
