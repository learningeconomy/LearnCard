import {
    staticField,
    type OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { extractVariablesByType } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';

/** Per editable description value; surrounding template prose is excluded. */
export const ROSTER_LONG_TEXT_LIMIT = 2_000;

/** Description text stays multiline, including spreadsheet values appended to existing prose. */
export const getLongTextVariables = (template?: OBv3CredentialTemplate | null): string[] => {
    if (!template) return [];
    const fields = [
        template.description,
        template.credentialSubject.achievement.description,
        template.credentialSubject.achievement.criteria?.narrative,
    ];
    const variables = [
        ...new Set(
            fields.flatMap(field => {
                if (!field || field.isSystem) return [];
                if (field.isDynamic && field.variableName) return [field.variableName];
                return [...(field.value?.matchAll(/\{\{(\w+)\}\}/g) ?? [])].map(match => match[1]!);
            })
        ),
    ];
    if (!variables.length) return [];
    const editableVariables = new Set(
        extractVariablesByType({ ...template, rawJson: undefined }).dynamic
    );
    // A score/date/link may also be mentioned in prose. Its structured field still
    // owns the editor and validation; only free-text description values expand.
    const structured = extractVariablesByType({
        ...template,
        // Inspect the editable fields, not the custom-schema passthrough JSON.
        rawJson: undefined,
        description: undefined,
        credentialSubject: {
            ...template.credentialSubject,
            achievement: {
                ...template.credentialSubject.achievement,
                description: staticField(''),
                criteria: {
                    ...template.credentialSubject.achievement.criteria,
                    narrative: staticField(''),
                },
            },
        },
    });
    const structuredVariables = new Set(structured.dynamic);
    return variables.filter(
        variable => editableVariables.has(variable) && !structuredVariables.has(variable)
    );
};

export const getOverlongTextVariables = (
    template: OBv3CredentialTemplate,
    values: Record<string, string>,
    longTextVariables: readonly string[] = getLongTextVariables(template)
): string[] =>
    longTextVariables.filter(name => (values[name]?.length ?? 0) > ROSTER_LONG_TEXT_LIMIT);
