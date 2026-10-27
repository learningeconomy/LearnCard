import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

/** UI authoring limit, not a restriction imposed by the Open Badges specification. */
export const ROSTER_LONG_TEXT_LIMIT = 5_000;

/** Only whole-field description variables need a multiline editor, not interpolated scores/links. */
export const getLongTextVariables = (template?: OBv3CredentialTemplate | null): string[] => {
    const fields = [
        template?.description,
        template?.credentialSubject.achievement.description,
        template?.credentialSubject.achievement.criteria?.narrative,
    ];
    return [
        ...new Set(
            fields.flatMap(field => {
                if (!field || field.isSystem) return [];
                if (field.isDynamic && field.variableName) return [field.variableName];
                const variable = field.value?.match(/^\s*\{\{(\w+)\}\}\s*$/)?.[1];
                return variable ? [variable] : [];
            })
        ),
    ];
};

export const getOverlongTextVariables = (
    template: OBv3CredentialTemplate,
    values: Record<string, string>
): string[] =>
    getLongTextVariables(template).filter(
        name => (values[name]?.length ?? 0) > ROSTER_LONG_TEXT_LIMIT
    );
