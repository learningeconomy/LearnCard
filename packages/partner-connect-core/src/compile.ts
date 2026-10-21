import { OBV3_CONTEXT, VC2_CONTEXT } from './constants';
import { canonicalJsonString } from './canonical';
import type {
    CompiledInlineTemplate,
    InlineCredentialTemplate,
    RawInlineCredentialTemplate,
    SimpleInlineCredentialTemplate,
} from './types';
import { validateInlineTemplate } from './validate';
import { buildVariableManifest } from './variables';
import { deepClone, getBareVariableName, isPlainObject, stripEmpty } from './utils';

const NUMERIC_SENTINEL_PREFIX = '__LC_NUM__';

const toNumericSentinel = (value: unknown): unknown => {
    const variableName = getBareVariableName(value);
    return variableName !== undefined ? `${NUMERIC_SENTINEL_PREFIX}{{${variableName}}}__` : value;
};

const finalizeCredentialTemplateJson = (value: unknown): string => {
    const canonical = canonicalJsonString(value);
    return canonical.replace(/"__LC_NUM__(\{\{\w+\}\})__"/g, '$1');
};

const compileSimpleTemplate = (template: SimpleInlineCredentialTemplate): string => {
    const credential = stripEmpty({
        '@context': [VC2_CONTEXT, OBV3_CONTEXT],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: template.name,
        description: template.description,
        image: template.image,
        issuer: stripEmpty({
            id: '{{issuer_did}}',
            type: ['Profile'],
            name: template.issuerName,
        }),
        validFrom: '{{issue_date}}',
        validUntil: template.validUntil,
        credentialSubject: stripEmpty({
            type: ['AchievementSubject'],
            id: '{{recipient_did}}',
            achievement: stripEmpty({
                type: ['Achievement'],
                name: template.name,
                description: template.description,
                achievementType: template.achievementType ?? 'Badge',
                image: template.image,
                criteria: stripEmpty({
                    narrative: template.criteria?.narrative,
                    id: template.criteria?.url,
                }),
                alignment: template.alignments?.map(alignment =>
                    stripEmpty({
                        type: ['Alignment'],
                        targetName: alignment.name,
                        targetUrl: alignment.url,
                        targetFramework: alignment.framework,
                        targetCode: alignment.code,
                    })
                ),
                tag: template.tags,
            }),
            activityStartDate: template.activity?.startDate,
            activityEndDate: template.activity?.endDate,
            creditsEarned: toNumericSentinel(template.credits?.earned),
            creditsAvailable: toNumericSentinel(template.credits?.available),
        }),
        evidence: template.evidence?.map(evidence =>
            stripEmpty({
                type: ['Evidence'],
                id: evidence.id,
                name: evidence.name,
                narrative: evidence.narrative,
            })
        ),
    });

    return finalizeCredentialTemplateJson(credential);
};

const forceCredentialSubjectId = (credentialSubject: unknown): void => {
    if (Array.isArray(credentialSubject)) {
        credentialSubject.forEach(subject => {
            if (isPlainObject(subject)) {
                subject.id = '{{recipient_did}}';
            }
        });

        return;
    }

    if (isPlainObject(credentialSubject)) {
        credentialSubject.id = '{{recipient_did}}';
    }
};

const compileRawTemplate = (template: RawInlineCredentialTemplate): string => {
    const credential = deepClone(template.rawCredential);

    if (!isPlainObject(credential)) {
        throw new Error('template.rawCredential must be a plain object');
    }

    if (isPlainObject(credential.issuer)) {
        credential.issuer.id = '{{issuer_did}}';
    } else {
        credential.issuer = { id: '{{issuer_did}}', type: ['Profile'] };
    }

    credential.validFrom = '{{issue_date}}';
    forceCredentialSubjectId(credential.credentialSubject);

    return finalizeCredentialTemplateJson(credential);
};

/**
 * Compiles an inline credential template into canonical template JSON plus a variable manifest.
 * Throws if validation fails.
 */
export const compileInlineTemplate = (
    template: InlineCredentialTemplate
): CompiledInlineTemplate => {
    const errors = validateInlineTemplate(template);

    if (errors.length > 0) {
        throw new Error(errors.map(error => `${error.path}: ${error.message}`).join('\n'));
    }

    const credentialTemplateJson =
        'rawCredential' in template && template.rawCredential !== undefined
            ? compileRawTemplate(template)
            : compileSimpleTemplate(template as SimpleInlineCredentialTemplate);

    return {
        credentialTemplateJson,
        variableManifest: buildVariableManifest(credentialTemplateJson),
        category: template.category ?? 'Achievement',
        walletSkills: template.walletSkills,
    };
};
