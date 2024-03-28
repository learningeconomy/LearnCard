import {
    Image,
    Profile,
    VC,
    AchievementCredential,
    // CredentialInfo,
    VerificationStatusEnum,
} from '@learncard/types';
import { CredentialInfo, LCCategoryEnum } from '../types';
import { format } from 'date-fns';

export const getImageFromImage = (image: Image): string => {
    if (typeof image === 'string') return image;

    return image.id ?? '';
};

export const getNameFromProfile = (profile: Profile): string => {
    if (typeof profile === 'string') return profile;

    return profile.name ?? '';
};

export const getImageFromProfile = (profile: Profile): string => {
    if (typeof profile === 'string') return '';

    return getImageFromImage(profile.image ?? '');
};

export const getInfoFromCredential = (
    credential: VC | AchievementCredential,
    dateFormat: string = 'dd MMM yyyy',
    options: { uppercaseDate?: boolean } = { uppercaseDate: true }
): CredentialInfo => {
    const { issuer, issuanceDate } = credential;

    const credentialSubject = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject[0]
        : credential.credentialSubject;

    const title = credentialSubject.achievement?.name;
    const issuee = credentialSubject.id;
    const imageUrl = credentialSubject.achievement?.image;

    let createdAt = format(new Date(issuanceDate), dateFormat);
    if (options.uppercaseDate) {
        createdAt = createdAt.toUpperCase();
    }

    return { title, createdAt, issuer, issuee, credentialSubject, imageUrl };
};

export const getColorForVerificationStatus = (
    status: (typeof VerificationStatusEnum)[keyof typeof VerificationStatusEnum]
) => {
    switch (status) {
        case VerificationStatusEnum.Success:
            return '#39B54A';
        case VerificationStatusEnum.Failed:
            return '#D01012';
        case VerificationStatusEnum.Error:
            return '#FFBD06';
        default:
            return '#000000';
    }
};

export const getCategoryColor = (category = LCCategoryEnum.achievement) => {
    switch (category) {
        case LCCategoryEnum.socialBadge:
            return 'cyan-700';
        case LCCategoryEnum.skill:
            return 'indigo-600';
        case LCCategoryEnum.achievement:
            return 'spice-600';
        case LCCategoryEnum.learningHistory:
            return 'emerald-700';
        case LCCategoryEnum.id:
            return 'yellow-400';
        case LCCategoryEnum.workHistory:
            return 'rose-600';
        case LCCategoryEnum.course:
            return 'emerald-700';
        case LCCategoryEnum.job:
            return 'rose-600';
        case LCCategoryEnum.currency:
            return 'cyan-700';
        case LCCategoryEnum.membership:
            return 'teal-500';
        default:
            return 'spice-600';
    }
};
