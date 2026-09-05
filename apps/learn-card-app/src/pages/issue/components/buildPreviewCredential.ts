import type { UnsignedVC } from '@learncard/types';

import {
    getDefaultCategoryForCredential,
    getFallBackImage,
} from 'learn-card-base/helpers/credentialHelpers';
import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { templateToJson } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/utils';
import { applyVariableValues } from './variableSubstitution';
import type { Recipient, RecipientMode } from './recipientTypes';

type BuildPreviewCredentialInput = {
    template: OBv3CredentialTemplate;
    previewValues: Record<string, string>;
    issuerDid?: string;
    issuerName: string;
    issuerImage?: string;
    currentUserDisplayName?: string;
    recipientMode: RecipientMode;
    recipients: Recipient[];
};

const hasAchievementImage = (subject: unknown): boolean => {
    if (!subject || typeof subject !== 'object' || Array.isArray(subject)) return false;

    const image = (subject as Record<string, unknown>).image;
    const imageRecord =
        image && typeof image === 'object' && !Array.isArray(image)
            ? (image as Record<string, unknown>)
            : undefined;
    const imageValue = imageRecord && imageRecord.value !== undefined ? imageRecord.value : image;

    return (
        typeof imageValue === 'string' ||
        Boolean(
            imageValue &&
                typeof imageValue === 'object' &&
                (imageValue as Record<string, unknown>).id
        )
    );
};

export const buildPreviewCredential = ({
    template,
    previewValues,
    issuerDid,
    issuerName,
    issuerImage,
    currentUserDisplayName,
    recipientMode,
    recipients,
}: BuildPreviewCredentialInput): Record<string, unknown> => {
    const json = applyVariableValues(templateToJson(template), previewValues);
    const fill = (obj: unknown): unknown => {
        if (typeof obj === 'string') {
            return obj.replace(/\{\{(\w+)\}\}/g, (_match, variableName) =>
                /date|time/i.test(variableName) ? new Date().toISOString() : ''
            );
        }
        if (Array.isArray(obj)) return obj.map(fill);
        if (obj && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj).map(([key, value]) => [key, fill(value)])
            );
        }
        return obj;
    };

    const filledJson = fill(json) as Record<string, unknown>;
    const rawSubject = filledJson.credentialSubject;
    const subjectObject =
        rawSubject && typeof rawSubject === 'object' && !Array.isArray(rawSubject)
            ? (rawSubject as Record<string, unknown>)
            : undefined;
    const previewCategory =
        getDefaultCategoryForCredential(filledJson as UnsignedVC) || 'Achievement';
    const fallbackImage = getFallBackImage(previewCategory);
    const achievement = template.credentialSubject?.achievement;
    const hasBadgeImage = hasAchievementImage(filledJson) || hasAchievementImage(achievement);
    const specificProfileRecipient =
        recipientMode === 'people' && recipients.length === 1 && recipients[0].kind === 'profile'
            ? recipients[0]
            : undefined;
    const hasSpecificRecipient = recipientMode === 'self' || Boolean(specificProfileRecipient);
    const imageForSubject = hasSpecificRecipient
        ? hasBadgeImage
            ? undefined
            : fallbackImage
        : fallbackImage;

    let credentialSubjectName: string | undefined;
    if (recipientMode === 'self') {
        credentialSubjectName = currentUserDisplayName || issuerName;
    } else if (specificProfileRecipient) {
        credentialSubjectName = specificProfileRecipient.displayName;
    }

    if (subjectObject) {
        const previewSubjectDid =
            recipientMode === 'self' ? issuerDid : specificProfileRecipient?.did;
        if (previewSubjectDid) subjectObject.id = previewSubjectDid;
    }

    return {
        ...filledJson,
        issuer: {
            id: issuerDid ?? 'did:web:preview',
            name: issuerName,
            ...(issuerImage ? { image: issuerImage } : {}),
        },
        credentialSubject: subjectObject
            ? {
                  ...subjectObject,
                  ...(credentialSubjectName ? { name: credentialSubjectName } : {}),
                  ...(imageForSubject ? { image: imageForSubject } : {}),
              }
            : rawSubject,
        validFrom: new Date().toISOString(),
    };
};
