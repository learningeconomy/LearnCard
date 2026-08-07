import { KNOWN_ACHIEVEMENT_TYPES, WALLET_CATEGORIES } from './constants';
import type {
    InlineAlignment,
    InlineCredentialTemplate,
    InlineEvidence,
    InlineTemplateValidationError,
    RawInlineCredentialTemplate,
    SimpleInlineCredentialTemplate,
    WalletSkillTag,
} from './types';
import {
    getBareVariableName,
    getDidYouMean,
    hasValidVariableInterpolation,
    isIsoDateString,
    isPlainObject,
    validateAchievementType,
    validateInterpolatedString,
    validateWalletCategory,
} from './utils';

const SIMPLE_TEMPLATE_KEYS = [
    'name',
    'description',
    'image',
    'issuerName',
    'achievementType',
    'criteria',
    'alignments',
    'tags',
    'activity',
    'credits',
    'validUntil',
    'evidence',
] as const;

const pushError = (
    errors: InlineTemplateValidationError[],
    path: string,
    message: string
): void => {
    errors.push({ path, message });
};

const validateHttpsOrVariableUrl = (
    value: unknown,
    path: string,
    errors: InlineTemplateValidationError[]
): void => {
    if (typeof value !== 'string' || value.length === 0) {
        pushError(errors, path, `${path} must be a non-empty string`);
        return;
    }

    validateInterpolatedString(value, path, errors);

    if (!value.startsWith('https://') && !hasValidVariableInterpolation(value)) {
        pushError(errors, path, `${path} must start with https:// or contain a {{variable}}`);
    }
};

const validateTemplateDate = (
    value: unknown,
    path: string,
    errors: InlineTemplateValidationError[]
): void => {
    if (typeof value !== 'string' || value.length === 0) {
        pushError(errors, path, `${path} must be an ISO-8601 date or a {{variable}} token`);
        return;
    }

    validateInterpolatedString(value, path, errors);

    if (getBareVariableName(value) !== undefined || isIsoDateString(value)) {
        return;
    }

    pushError(errors, path, `${path} must be an ISO-8601 date or a {{variable}} token`);
};

const validateTemplateNumber = (
    value: unknown,
    path: string,
    errors: InlineTemplateValidationError[]
): void => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return;
    }

    if (typeof value === 'string') {
        validateInterpolatedString(value, path, errors);

        if (getBareVariableName(value) !== undefined) {
            return;
        }
    }

    pushError(errors, path, `${path} must be a number or a {{variable}} token`);
};

const validateStringArray = (
    value: unknown,
    path: string,
    errors: InlineTemplateValidationError[]
): value is string[] => {
    if (!Array.isArray(value)) {
        pushError(errors, path, `${path} must be an array of strings`);
        return false;
    }

    value.forEach((item, index) => {
        if (typeof item !== 'string') {
            pushError(errors, `${path}[${index}]`, `${path}[${index}] must be a string`);
            return;
        }

        validateInterpolatedString(item, `${path}[${index}]`, errors);
    });

    return true;
};

const validateWalletSkillTags = (
    value: unknown,
    path: string,
    errors: InlineTemplateValidationError[]
): value is WalletSkillTag[] => {
    if (value === undefined) {
        return true;
    }

    if (!Array.isArray(value)) {
        pushError(errors, path, `${path} must be an array`);
        return false;
    }

    value.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;

        if (!isPlainObject(item)) {
            pushError(errors, itemPath, `${itemPath} must be an object`);
            return;
        }

        if (typeof item.frameworkId !== 'string' || item.frameworkId.length === 0) {
            pushError(
                errors,
                `${itemPath}.frameworkId`,
                `${itemPath}.frameworkId must be a non-empty string`
            );
        }

        if (typeof item.id !== 'string' || item.id.length === 0) {
            pushError(errors, `${itemPath}.id`, `${itemPath}.id must be a non-empty string`);
        }

        if (item.proficiencyLevel !== undefined && typeof item.proficiencyLevel !== 'string') {
            pushError(
                errors,
                `${itemPath}.proficiencyLevel`,
                `${itemPath}.proficiencyLevel must be a string`
            );
        }
    });

    return true;
};

const validateAlignment = (
    value: unknown,
    path: string,
    errors: InlineTemplateValidationError[]
): value is InlineAlignment => {
    if (!isPlainObject(value)) {
        pushError(errors, path, `${path} must be an object`);
        return false;
    }

    if (typeof value.name !== 'string' || value.name.trim().length === 0) {
        pushError(errors, `${path}.name`, `${path}.name is required`);
    } else {
        validateInterpolatedString(value.name, `${path}.name`, errors);
    }

    if (value.url === undefined) {
        pushError(errors, `${path}.url`, `${path}.url is required`);
    } else {
        validateHttpsOrVariableUrl(value.url, `${path}.url`, errors);
    }

    if (value.framework !== undefined) {
        if (typeof value.framework !== 'string') {
            pushError(errors, `${path}.framework`, `${path}.framework must be a string`);
        } else {
            validateInterpolatedString(value.framework, `${path}.framework`, errors);
        }
    }

    if (value.code !== undefined) {
        if (typeof value.code !== 'string') {
            pushError(errors, `${path}.code`, `${path}.code must be a string`);
        } else {
            validateInterpolatedString(value.code, `${path}.code`, errors);
        }
    }

    return true;
};

const validateEvidence = (
    value: unknown,
    path: string,
    errors: InlineTemplateValidationError[]
): value is InlineEvidence => {
    if (!isPlainObject(value)) {
        pushError(errors, path, `${path} must be an object`);
        return false;
    }

    if (value.id !== undefined) {
        validateHttpsOrVariableUrl(value.id, `${path}.id`, errors);
    }

    if (value.name !== undefined) {
        if (typeof value.name !== 'string') {
            pushError(errors, `${path}.name`, `${path}.name must be a string`);
        } else {
            validateInterpolatedString(value.name, `${path}.name`, errors);
        }
    }

    if (value.narrative !== undefined) {
        if (typeof value.narrative !== 'string') {
            pushError(errors, `${path}.narrative`, `${path}.narrative must be a string`);
        } else {
            validateInterpolatedString(value.narrative, `${path}.narrative`, errors);
        }
    }

    return true;
};

const validateRawCredentialVariables = (
    value: unknown,
    path: string,
    errors: InlineTemplateValidationError[]
): void => {
    if (typeof value === 'string') {
        validateInterpolatedString(value, path, errors);
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item, index) =>
            validateRawCredentialVariables(item, `${path}[${index}]`, errors)
        );
        return;
    }

    if (isPlainObject(value)) {
        Object.keys(value).forEach(key => {
            validateRawCredentialVariables(value[key], `${path}.${key}`, errors);
        });
    }
};

const validateSimpleTemplate = (
    template: SimpleInlineCredentialTemplate,
    errors: InlineTemplateValidationError[]
): void => {
    if (typeof template.name !== 'string' || template.name.trim().length === 0) {
        pushError(errors, 'template.name', 'template.name is required');
    } else {
        validateInterpolatedString(template.name, 'template.name', errors);
    }

    if (template.description !== undefined) {
        if (typeof template.description !== 'string') {
            pushError(errors, 'template.description', 'template.description must be a string');
        } else {
            validateInterpolatedString(template.description, 'template.description', errors);
        }
    }

    if (template.image !== undefined) {
        validateHttpsOrVariableUrl(template.image, 'template.image', errors);
    }

    if (template.issuerName !== undefined) {
        if (typeof template.issuerName !== 'string') {
            pushError(errors, 'template.issuerName', 'template.issuerName must be a string');
        } else {
            validateInterpolatedString(template.issuerName, 'template.issuerName', errors);
        }
    }

    if (template.achievementType !== undefined) {
        if (typeof template.achievementType !== 'string') {
            pushError(
                errors,
                'template.achievementType',
                'template.achievementType must be a string'
            );
        } else {
            const message = validateAchievementType(template.achievementType);

            if (message !== undefined) {
                pushError(errors, 'template.achievementType', message);
            }
        }
    }

    if (template.category !== undefined && !validateWalletCategory(template.category)) {
        const suggestion =
            typeof template.category === 'string'
                ? getDidYouMean(template.category, WALLET_CATEGORIES)
                : undefined;
        const suffix = suggestion ? `; did you mean "${suggestion}"?` : '';
        pushError(
            errors,
            'template.category',
            `template.category must be one of ${WALLET_CATEGORIES.join(', ')}${suffix}`
        );
    }

    if (template.criteria !== undefined) {
        if (!isPlainObject(template.criteria)) {
            pushError(errors, 'template.criteria', 'template.criteria must be an object');
        } else {
            if (template.criteria.narrative !== undefined) {
                if (typeof template.criteria.narrative !== 'string') {
                    pushError(
                        errors,
                        'template.criteria.narrative',
                        'template.criteria.narrative must be a string'
                    );
                } else {
                    validateInterpolatedString(
                        template.criteria.narrative,
                        'template.criteria.narrative',
                        errors
                    );
                }
            }

            if (template.criteria.url !== undefined) {
                validateHttpsOrVariableUrl(template.criteria.url, 'template.criteria.url', errors);
            }
        }
    }

    if (template.alignments !== undefined) {
        if (!Array.isArray(template.alignments)) {
            pushError(errors, 'template.alignments', 'template.alignments must be an array');
        } else {
            template.alignments.forEach((alignment, index) => {
                validateAlignment(alignment, `template.alignments[${index}]`, errors);
            });
        }
    }

    if (template.tags !== undefined) {
        validateStringArray(template.tags, 'template.tags', errors);
    }

    if (template.activity !== undefined) {
        if (!isPlainObject(template.activity)) {
            pushError(errors, 'template.activity', 'template.activity must be an object');
        } else {
            if (template.activity.startDate !== undefined) {
                validateTemplateDate(
                    template.activity.startDate,
                    'template.activity.startDate',
                    errors
                );
            }

            if (template.activity.endDate !== undefined) {
                validateTemplateDate(
                    template.activity.endDate,
                    'template.activity.endDate',
                    errors
                );
            }
        }
    }

    if (template.credits !== undefined) {
        if (!isPlainObject(template.credits)) {
            pushError(errors, 'template.credits', 'template.credits must be an object');
        } else {
            if (template.credits.earned !== undefined) {
                validateTemplateNumber(template.credits.earned, 'template.credits.earned', errors);
            }

            if (template.credits.available !== undefined) {
                validateTemplateNumber(
                    template.credits.available,
                    'template.credits.available',
                    errors
                );
            }
        }
    }

    if (template.validUntil !== undefined) {
        validateTemplateDate(template.validUntil, 'template.validUntil', errors);
    }

    if (template.evidence !== undefined) {
        if (!Array.isArray(template.evidence)) {
            pushError(errors, 'template.evidence', 'template.evidence must be an array');
        } else {
            template.evidence.forEach((evidence, index) => {
                validateEvidence(evidence, `template.evidence[${index}]`, errors);
            });
        }
    }

    validateWalletSkillTags(template.walletSkills, 'template.walletSkills', errors);
};

const validateRawTemplate = (
    template: RawInlineCredentialTemplate,
    errors: InlineTemplateValidationError[]
): void => {
    const invalidKeys = SIMPLE_TEMPLATE_KEYS.filter(key =>
        Object.prototype.hasOwnProperty.call(template, key)
    );

    invalidKeys.forEach(key => {
        pushError(
            errors,
            'template.rawCredential',
            `template.rawCredential cannot be combined with template.${key} — use one or the other`
        );
    });

    if (!isPlainObject(template.rawCredential)) {
        pushError(
            errors,
            'template.rawCredential',
            'template.rawCredential must be a plain object'
        );
        return;
    }

    if (!Array.isArray(template.rawCredential['@context'])) {
        pushError(
            errors,
            'template.rawCredential.@context',
            'template.rawCredential.@context must be an array'
        );
    }

    if (!Array.isArray(template.rawCredential.type)) {
        pushError(
            errors,
            'template.rawCredential.type',
            'template.rawCredential.type must be an array'
        );
    }

    if (template.category !== undefined && !validateWalletCategory(template.category)) {
        const suggestion =
            typeof template.category === 'string'
                ? getDidYouMean(template.category, WALLET_CATEGORIES)
                : undefined;
        const suffix = suggestion ? `; did you mean "${suggestion}"?` : '';
        pushError(
            errors,
            'template.category',
            `template.category must be one of ${WALLET_CATEGORIES.join(', ')}${suffix}`
        );
    }

    validateWalletSkillTags(template.walletSkills, 'template.walletSkills', errors);
    validateRawCredentialVariables(template.rawCredential, 'template.rawCredential', errors);
};

/**
 * Validates an inline credential template and returns all path-based errors.
 */
export const validateInlineTemplate = (
    template: InlineCredentialTemplate
): InlineTemplateValidationError[] => {
    const errors: InlineTemplateValidationError[] = [];

    if (!isPlainObject(template)) {
        return [{ path: 'template', message: 'template must be a plain object' }];
    }

    if ('rawCredential' in template && template.rawCredential !== undefined) {
        validateRawTemplate(template, errors);
        return errors;
    }

    validateSimpleTemplate(template as SimpleInlineCredentialTemplate, errors);
    return errors;
};

export { KNOWN_ACHIEVEMENT_TYPES };
