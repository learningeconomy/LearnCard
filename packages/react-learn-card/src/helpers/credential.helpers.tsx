import React from 'react';
import { format } from 'date-fns';

import {
    Image,
    Profile,
    VC,
    AchievementCredential,
    VerificationStatusEnum,
} from '@learncard/types';
import { CredentialInfo, LCCategoryEnum } from '../types';

import SocialBadgesIcon from '../components/svgs/SocialBadgesIcon';
import PuzzlePiece from '../components/svgs/PuzzlePiece';
import KeyIcon from '../components/svgs/KeyIcon';
import { Briefcase, Graduation, Trophy, User } from '../components';
import AccommodationsIcon from '../components/svgs/AccommodationsIcon';
import AccomplishmentsIcon from '../components/svgs/AccomplishmentsIcon';

export const getImageFromImage = (image: Image): string => {
    if (typeof image === 'string') return image;

    return image.id ?? '';
};

export const getNameFromProfile = (profile: Profile): string => {
    if (typeof profile === 'string') return profile;

    return profile.name || profile.displayName || '';
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
            return 'blue-400';
        case LCCategoryEnum.job:
            return 'rose-600';
        case LCCategoryEnum.course:
            return 'emerald-700';
        case LCCategoryEnum.currency:
            return 'cyan-700';
        case LCCategoryEnum.membership:
            return 'teal-500';
        default:
            return 'spice-600';
    }
};

export const getCategoryPrimaryColor = (category = LCCategoryEnum.achievement) => {
    switch (category) {
        case LCCategoryEnum.socialBadge:
            return 'cyan';
        case LCCategoryEnum.skill:
            return 'indigo';
        case LCCategoryEnum.achievement:
            return 'spice';
        case LCCategoryEnum.learningHistory:
            return 'emerald';
        case LCCategoryEnum.id:
            return 'yellow';
        case LCCategoryEnum.workHistory:
            return 'blue';
        case LCCategoryEnum.job:
            return 'rose';
        case LCCategoryEnum.course:
            return 'emerald';
        case LCCategoryEnum.currency:
            return 'cyan';
        case LCCategoryEnum.membership:
            return 'teal';
        case LCCategoryEnum.accommodations:
            return 'amber';
        case LCCategoryEnum.accomplishments:
            return 'lime';
        default:
            return 'spice';
    }
};

export const getCategoryLightColor = (category = LCCategoryEnum.achievement) => {
    return `${getCategoryPrimaryColor(category)}-500`;
};

export const getCategoryDarkColor = (category = LCCategoryEnum.achievement) => {
    return `${getCategoryPrimaryColor(category)}-700`;
};

export const getCategoryIcon = (category = LCCategoryEnum.achievement) => {
    switch (category) {
        case LCCategoryEnum.socialBadge:
            return <SocialBadgesIcon />;
        case LCCategoryEnum.skill:
            return <PuzzlePiece />;
        case LCCategoryEnum.achievement:
            return <Trophy size="21" />;
        case LCCategoryEnum.course:
        case LCCategoryEnum.learningHistory:
            return <Graduation size="21" />;
        case LCCategoryEnum.job:
        case LCCategoryEnum.workHistory:
            return <Briefcase size="21" />;
        case LCCategoryEnum.id:
            return <User size="21" />;
        case LCCategoryEnum.membership:
            return <KeyIcon size="21" />;
        case LCCategoryEnum.currency:
        case LCCategoryEnum.accommodations:
            return <AccommodationsIcon size="21" />;
        case LCCategoryEnum.accomplishments:
            return <AccomplishmentsIcon size="21" />;
        case LCCategoryEnum.currency:
        default:
            console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
            console.log('getCategoryIcon - unhandled category:', category);
            return undefined;
    }
};

export const getTotalCountOfSkills = (
    skills: { skill: string; category: string; subSkills: string[] }[]
) => {
    if (!skills || skills.length === 0) return 0;
    let totalCount = 0;

    skills?.forEach(skill => {
        totalCount++; // Increment for each skill

        if (skill?.subSkills) {
            totalCount += skill?.subSkills.length; // Increment for each subskill
        }
    });

    return totalCount;
};
