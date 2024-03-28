import {
    Image,
    Profile,
    VC,
    AchievementCredential,
    // CredentialInfo,
    VerificationStatusEnum,
} from '@learncard/types';
import { CredentialInfo } from '../types';
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
