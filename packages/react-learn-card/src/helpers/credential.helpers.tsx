import React from 'react';
import { format } from 'date-fns';

import {
    VerificationStatusEnum,
    type Image,
    type Profile,
    type VC,
    type AchievementCredential,
} from '@learncard/types';
import { LCCategoryEnum, type CredentialInfo } from '../types';

import SocialBadgesIcon from '../components/svgs/SocialBadgesIcon';
import PuzzlePiece from '../components/svgs/PuzzlePiece';
import KeyIcon from '../components/svgs/KeyIcon';
import User from '../components/svgs/User';
import Trophy from '../components/svgs/Trophy';
import Graduation from '../components/svgs/Graduation';
import Briefcase from '../components/svgs/Briefcase';
import AccommodationsIcon from '../components/svgs/AccommodationsIcon';
import AccomplishmentsIcon from '../components/svgs/AccomplishmentsIcon';
import ScoutsLogo from '../components/svgs/ScoutsLogo';

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
    dateFormat = 'dd MMM yyyy',
    options: { uppercaseDate?: boolean } = { uppercaseDate: true }
): CredentialInfo => {
    const { issuer, issuanceDate, validFrom } = credential;

    const credentialSubject = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject[0]
        : credential.credentialSubject;

    const title = credentialSubject.achievement?.name;
    const issuee = credentialSubject.id;
    const imageUrl = credentialSubject.achievement?.image;

    // Support both VC 2.0 (validFrom) and VC 1.0 (issuanceDate)
    // Gracefully handle missing dates
    const dateValue = validFrom || issuanceDate;
    let createdAt = '';

    if (dateValue) {
        try {
            createdAt = format(new Date(dateValue), dateFormat);
            if (options.uppercaseDate) {
                createdAt = createdAt.toUpperCase();
            }
        } catch {
            console.warn('Invalid date format in credential:', dateValue);
            createdAt = '';
        }
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
            return 'blue-600';
        case LCCategoryEnum.skill:
            return 'indigo-600';
        case LCCategoryEnum.achievement:
            return 'pink-600';
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
            return 'blue-600';
        case LCCategoryEnum.membership:
            return 'teal-500';
        default:
            return 'spice-600';
    }
};

export const getCategoryPrimaryColor = (category = LCCategoryEnum.achievement) => {
    switch (category) {
        case LCCategoryEnum.socialBadge:
            return 'blue';
        case LCCategoryEnum.skill:
            return 'indigo';
        case LCCategoryEnum.achievement:
            return 'pink';
        case LCCategoryEnum.learningHistory:
            return 'emerald';
        case LCCategoryEnum.id:
            return 'yellow';
        case LCCategoryEnum.workHistory:
            return 'cyan';
        case LCCategoryEnum.job:
            return 'rose';
        case LCCategoryEnum.course:
            return 'emerald';
        case LCCategoryEnum.currency:
            return 'cyan';
        case LCCategoryEnum.membership:
            return 'teal';
        case LCCategoryEnum.accommodations:
            return 'violet';
        case LCCategoryEnum.accomplishments:
            return 'yellow';
        default:
            return 'spice';
    }
};

export const getCategoryLightColor = (category = LCCategoryEnum.achievement) => {
    if (category === LCCategoryEnum.meritBadge) {
        return 'sp-purple-base';
    }

    return `${getCategoryPrimaryColor(category)}-500`;
};

export const getCategoryDarkColor = (category = LCCategoryEnum.achievement) => {
    if (category === LCCategoryEnum.meritBadge) {
        return 'sp-purple-base';
    }

    return `${getCategoryPrimaryColor(category)}-700`;
};

export const getCategoryIcon = (category = LCCategoryEnum.achievement, size = '21') => {
    switch (category) {
        case LCCategoryEnum.socialBadge:
            return <SocialBadgesIcon size={size} />;
        case LCCategoryEnum.skill:
            return <PuzzlePiece size={size} />;
        case LCCategoryEnum.achievement:
            return <Trophy size={size} />;
        case LCCategoryEnum.course:
        case LCCategoryEnum.learningHistory:
            return <Graduation size={size} />;
        case LCCategoryEnum.job:
        case LCCategoryEnum.workHistory:
            return <Briefcase size={size} />;
        case LCCategoryEnum.id:
            return <User size={size} />;
        case LCCategoryEnum.membership:
            return <KeyIcon size={size} />;
        case LCCategoryEnum.currency:
        case LCCategoryEnum.accommodations:
            return <AccommodationsIcon size={size} />;
        case LCCategoryEnum.accomplishments:
            return <AccomplishmentsIcon size={size} />;
        case LCCategoryEnum.meritBadge:
            return <ScoutsLogo size={size} />;
        default:
            console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
            console.log('getCategoryIcon - unhandled category:', category);
            return undefined;
    }
};

export const categorizeSkills = (skills: any) => {
    let categorizedSkills = skills.reduce((acc: any, obj: any) => {
        // If the category doesn't exist in the accumulator, create a new array for it
        if (!acc[obj.category]) {
            acc[obj.category] = [];
            acc[obj.category].totalSkills = 0; // Initialize totalSkills count
            acc[obj.category].totalSubskills = 0; // Initialize totalSubskills count
        }

        // Check if the skill already exists for this category
        let existingSkill = acc[obj.category].find((skill: any) => skill.skill === obj.skill);
        if (existingSkill) {
            // Update the existing object's subskills
            existingSkill.subskills = [
                ...new Set([...(existingSkill?.subskills ?? []), ...(obj?.subskills ?? [])]),
            ];
        } else {
            // Add a new object to the array for this category
            acc[obj.category].push(obj);
            acc[obj.category].totalSkills += 1; // Increment totalSkills count
        }

        // Calculate total subskills count for this category
        let totalSubskillsCount = acc[obj.category].reduce(
            (total: number, skill: any) => total + (skill?.subskills?.length ?? 0),
            0
        );
        acc[obj.category].totalSubskillsCount = totalSubskillsCount;

        return acc;
    }, {});

    return categorizedSkills;
};

export const getTotalCountOfSkills = (
    skills: { skill: string; category: string; subSkills: string[] }[]
) => {
    if (!skills || skills.length === 0) return 0;
    let totalCount = 0;

    skills?.forEach(skill => {
        totalCount += 1; // Increment for each skill

        if (skill?.subSkills) {
            totalCount += skill?.subSkills.length; // Increment for each subskill
        }
    });

    return totalCount;
};
