import { getLogger } from 'learn-card-base';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import {
    OBv3CredentialTemplate,
    staticField,
    systemField,
    dynamicField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
} from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import {
    templateToJson,
    validateTemplate,
} from '../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';

const log = getLogger('simple-send');

/**
 * SimpleSend builds standards-pure OBv3 credentials and deliberately bypasses
 * the boost pipeline (`newCredential({ type: 'boost' })` / `createBoost`),
 * which injects the custom `https://ctx.learncard.com/boosts/*` context. Only
 * the client-constructed credential is guaranteed pure — `send()` may still
 * create a boost server-side for delivery, which is accepted for this prototype.
 */

export type SimpleCredentialType =
    | 'badge'
    | 'certificate'
    | 'course'
    | 'skill'
    | 'license'
    | 'membership'
    | 'micro-credential';

const ACHIEVEMENT_TYPE_BY_SIMPLE_TYPE: Record<SimpleCredentialType, string> = {
    badge: 'Badge',
    certificate: 'Certificate',
    course: 'Course',
    skill: 'Competency',
    membership: 'Membership',
    license: 'License',
    'micro-credential': 'MicroCredential',
};

export interface SimpleSendInput {
    credentialType: SimpleCredentialType;
    name: string;
    description: string;
    criteriaNarrative?: string;
    issuerName?: string;
    imageUrl?: string;
}

export type SimpleSendRecipient = { kind: 'self' } | { kind: 'identifier'; value: string };

export const buildSimpleTemplate = (input: SimpleSendInput): OBv3CredentialTemplate => {
    const achievementType = ACHIEVEMENT_TYPE_BY_SIMPLE_TYPE[input.credentialType];

    return {
        schemaType: 'obv3',
        contexts: DEFAULT_CONTEXTS,
        types: DEFAULT_TYPES,
        name: staticField(input.name),
        issuer: {
            id: systemField('issuer_did'),
            name: input.issuerName ? staticField(input.issuerName) : staticField(''),
        },
        credentialSubject: {
            id: systemField('recipient_did'),
            achievement: {
                name: staticField(input.name),
                description: staticField(input.description),
                achievementType: staticField(achievementType),
                ...(input.imageUrl ? { image: staticField(input.imageUrl) } : {}),
                criteria: {
                    narrative: input.criteriaNarrative
                        ? staticField(input.criteriaNarrative)
                        : staticField(`Awarded for: ${input.name}`),
                },
            },
        },
        validFrom: systemField('issue_date'),
        customFields: [],
    };
};

export const buildUnsignedCredential = (
    input: SimpleSendInput,
    issuerDid: string,
    recipientDid?: string
): Record<string, unknown> =>
    fillTemplateSystemVars(buildSimpleTemplate(input), issuerDid, recipientDid);

export interface IssueAndSendResult {
    credentialUri: string;
    signedCredential: Record<string, unknown>;
    inbox?: unknown;
}

export const fillTemplateSystemVars = (
    template: OBv3CredentialTemplate,
    issuerDid: string,
    recipientDid?: string
): Record<string, unknown> => {
    const json = templateToJson(template);
    const now = new Date().toISOString();
    const replacements: Record<string, string> = {
        issuer_did: issuerDid,
        issue_date: now,
        ...(recipientDid ? { recipient_did: recipientDid } : {}),
    };

    const replaceSystemVars = (obj: unknown): unknown => {
        if (typeof obj === 'string') {
            return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
                varName in replacements ? replacements[varName] : match
            );
        }
        if (Array.isArray(obj)) return obj.map(replaceSystemVars);
        if (obj && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, replaceSystemVars(v)])
            );
        }
        return obj;
    };

    const filled = replaceSystemVars(json) as Record<string, unknown>;
    const subject = filled.credentialSubject as Record<string, unknown> | undefined;
    if (!recipientDid && subject && typeof subject.id === 'string' && subject.id.includes('{{')) {
        delete subject.id;
    }
    return filled;
};

export const issueAndSendCredential = async (
    wallet: BespokeLearnCard,
    template: OBv3CredentialTemplate,
    recipient: SimpleSendRecipient
): Promise<IssueAndSendResult> => {
    const issuerDid = wallet.id.did();
    if (!issuerDid) throw new Error('No issuer DID available — is the wallet initialized?');

    const structuralErrors = validateTemplate(template);
    if (structuralErrors.length > 0) {
        throw new Error(structuralErrors.map(e => `${e.field}: ${e.message}`).join('; '));
    }

    const isSelf = recipient.kind === 'self';
    const recipientIdentifier = isSelf ? issuerDid : recipient.value;
    const recipientDid =
        isSelf || recipientIdentifier.startsWith('did:') ? recipientIdentifier : undefined;

    const unsigned = fillTemplateSystemVars(template, issuerDid, recipientDid);

    const signedCredential = (await wallet.invoke.issueCredential(unsigned as any)) as Record<
        string,
        unknown
    >;

    // Omitting templateUri/template is what keeps this off the boost-template path.
    const response = await wallet.invoke.send({
        type: 'boost',
        recipient: recipientIdentifier,
        signedCredential: signedCredential as any,
    });

    log.info('simple-send.issued', {
        schemaType: template.schemaType,
        recipientKind: recipient.kind,
        delivered: Boolean(response?.credentialUri),
        viaInbox: Boolean(response?.inbox),
    });

    return {
        credentialUri: response.credentialUri,
        signedCredential,
        inbox: response.inbox,
    };
};

export const issueAndSendSimpleCredential = async (
    wallet: BespokeLearnCard,
    input: SimpleSendInput,
    recipient: SimpleSendRecipient
): Promise<IssueAndSendResult> =>
    issueAndSendCredential(wallet, buildSimpleTemplate(input), recipient);

export const isEmailRecipient = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export { dynamicField };
