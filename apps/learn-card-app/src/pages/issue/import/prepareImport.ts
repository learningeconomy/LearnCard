import {
    staticField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
    type OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { jsonToTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';

import type { NormalizedImport } from './normalizeToObv3';

export interface PreparedImport {
    template: OBv3CredentialTemplate;
    note?: string;
}

const ISSUER_PLACEHOLDER = '{{issuer_did}}';
const RECIPIENT_PLACEHOLDER = '{{recipient_did}}';
const ISSUE_DATE_PLACEHOLDER = '{{issue_date}}';

/**
 * Force the current user as issuer and reset recipient / dates / proof to their
 * system placeholders inside an arbitrary credential body. Imported data must
 * never carry a foreign issuer DID or a stale proof into signing, which would
 * invalidate the credential.
 */
const sanitizeIssuanceIdentity = (json: Record<string, unknown>): Record<string, unknown> => {
    const clone = JSON.parse(JSON.stringify(json)) as Record<string, unknown>;

    clone.issuer = ISSUER_PLACEHOLDER;
    clone.validFrom = ISSUE_DATE_PLACEHOLDER;
    if ('issuanceDate' in clone) clone.issuanceDate = ISSUE_DATE_PLACEHOLDER;
    delete clone.proof;

    const setRecipient = (subject: unknown): void => {
        if (subject && typeof subject === 'object' && !Array.isArray(subject)) {
            (subject as Record<string, unknown>).id = RECIPIENT_PLACEHOLDER;
        }
    };
    if (Array.isArray(clone.credentialSubject)) clone.credentialSubject.forEach(setRecipient);
    else setRecipient(clone.credentialSubject);

    return clone;
};

/**
 * Convert imported data into a page-ready template. Recognized OBv3 records
 * become a structured single-achievement template editable in the form; CLR and
 * any other valid VC are preserved verbatim as raw-JSON passthrough so advanced
 * users can edit them directly instead of collapsing to one achievement. In both
 * cases the issuer / recipient / date fields are reset to system placeholders.
 */
export const prepareImportedTemplate = (result: NormalizedImport): PreparedImport => {
    const parsed = jsonToTemplate(result.obv3Json);

    if (parsed.schemaType && parsed.schemaType !== 'obv3') {
        const rawJson = sanitizeIssuanceIdentity(result.obv3Json);
        const template: OBv3CredentialTemplate = {
            schemaType: 'custom',
            rawJson,
            contexts: Array.isArray(rawJson['@context'])
                ? (rawJson['@context'] as string[])
                : DEFAULT_CONTEXTS,
            types: Array.isArray(rawJson.type) ? (rawJson.type as string[]) : DEFAULT_TYPES,
            name: staticField(String(rawJson.name ?? 'Imported credential')),
            issuer: { name: staticField('') },
            credentialSubject: {
                achievement: { name: staticField(''), description: staticField('') },
            },
            validFrom: staticField(''),
            customFields: [],
        };
        return { template, note: 'Imported as JSON — review and edit it directly before issuing.' };
    }

    const template: OBv3CredentialTemplate = {
        ...parsed,
        schemaType: 'obv3',
        rawJson: undefined,
        contexts: DEFAULT_CONTEXTS,
        types: DEFAULT_TYPES,
        issuer: { ...parsed.issuer, id: systemField('issuer_did'), name: staticField('') },
        validFrom: systemField('issue_date'),
        credentialSubject: {
            ...parsed.credentialSubject,
            id: systemField('recipient_did'),
        },
    };

    return { template };
};
