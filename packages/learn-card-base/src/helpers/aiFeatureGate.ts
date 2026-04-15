import { calculateAge } from './dateHelpers';
import { getMinorAgeThreshold } from '../constants/gdprAgeLimits';

export type AiFeatureAgeGateInput = {
    profileType?: string | null;
    dob?: string | null;
    country?: string | null;
};

export type AiFeatureAgeGateState = {
    isChildProfile: boolean;
    isMinorByAge: boolean;
    isAgeQualifiedChild: boolean;
    isAiAgeRestricted: boolean;
};

export const getAiFeatureAgeGateState = ({
    profileType,
    dob,
    country,
}: AiFeatureAgeGateInput): AiFeatureAgeGateState => {
    const age = dob ? calculateAge(dob) : null;
    const threshold = getMinorAgeThreshold(country ?? undefined);
    const isChildProfile = profileType === 'child';
    const isMinorByAge = age !== null && !Number.isNaN(age) && age < threshold;
    const isAgeQualifiedChild = age !== null && !Number.isNaN(age) && age >= threshold;
    const isAiAgeRestricted = isChildProfile ? !isAgeQualifiedChild : isMinorByAge;

    return {
        isChildProfile,
        isMinorByAge,
        isAgeQualifiedChild,
        isAiAgeRestricted,
    };
};
