import { Image, Profile, VC, AchievementCredential, CredentialInfo } from '@learncard/types';
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
    dateFormat: string = 'dd MMM yyyy'
): CredentialInfo => {
    const { issuer, issuanceDate } = credential;

    const credentialSubject = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject[0]
        : credential.credentialSubject;

    const title = credentialSubject.achievement?.name;
    const createdAt = format(new Date(issuanceDate), dateFormat).toUpperCase();
    const issuee = credentialSubject.id;

    return { title, createdAt, issuer, issuee, credentialSubject };
};
