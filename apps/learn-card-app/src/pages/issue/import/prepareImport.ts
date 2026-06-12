import {
    staticField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
    type OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { jsonToTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import { buildSimpleTemplate } from '../../../components/simple-send/simpleSend.helpers';

import { summarizeObv3 } from './importSummary';
import type { NormalizedImport } from './normalizeToObv3';

export interface PreparedImport {
    template: OBv3CredentialTemplate;
    note?: string;
}

/**
 * Convert imported data into a page-ready, single-achievement OBv3 template.
 * Multi-achievement (CLR) records collapse to their first achievement, and
 * unrecognized credentials fall back to a basics-only seed. In every case the
 * current user is forced as issuer and the recipient/date fields are reset to
 * their system placeholders — imported data must never carry a foreign issuer
 * DID into signing, which would invalidate the proof.
 */
export const prepareImportedTemplate = (result: NormalizedImport): PreparedImport => {
    const parsed = jsonToTemplate(result.obv3Json);
    let template = parsed;
    let note: string | undefined;

    if (parsed.schemaType === 'clr2') {
        template = { ...parsed, clrSubject: undefined, rawJson: undefined };
        note = 'We imported the first achievement from this record.';
    } else if (parsed.schemaType !== 'obv3') {
        const summary = summarizeObv3(result.obv3Json);
        const base = buildSimpleTemplate({
            credentialType: 'badge',
            name: summary.name,
            description: summary.description ?? '',
        });
        template = summary.image
            ? {
                  ...base,
                  credentialSubject: {
                      ...base.credentialSubject,
                      achievement: {
                          ...base.credentialSubject.achievement,
                          image: staticField(summary.image),
                      },
                  },
              }
            : base;
        note = 'We brought over the basics — review the details before issuing.';
    }

    template = {
        ...template,
        schemaType: 'obv3',
        rawJson: undefined,
        contexts: DEFAULT_CONTEXTS,
        types: DEFAULT_TYPES,
        issuer: { ...template.issuer, id: systemField('issuer_did'), name: staticField('') },
        validFrom: systemField('issue_date'),
        credentialSubject: {
            ...template.credentialSubject,
            id: systemField('recipient_did'),
        },
    };

    return { template, note };
};
