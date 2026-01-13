import React from 'react';

import Trophy from 'learn-card-base/svgs/Trophy';
import Coins from 'learn-card-base/svgs/Coins';
import IDIcon from 'learn-card-base/svgs/IDIcon';
import Briefcase from 'learn-card-base/svgs/Briefcase';
import Graduation from 'learn-card-base/svgs/Graduation';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { PurpleMeritBadgesIcon } from 'learn-card-base/svgs/MeritBadgesIcon';
import { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';
import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';
import { CredentialCategoryEnum } from 'learn-card-base';

export enum SubheaderTypeEnum {
    SocialBadge = 'socialBadge',
    Currency = 'currency',
    ID = 'id',
    Achievement = 'achievement',
    Skill = 'skill',
    Job = 'job',
    Learning = 'learning',
    Membership = 'membership',
    MeritBadge = 'meritBadge',
    default = 'default',
}

export interface LocationState {
    pathname: string;
}

export const SubheaderContentType: Record<
    SubheaderTypeEnum,
    {
        title: string;
        IconComponent: React.FC<{ className?: string }> | null;
        iconColor: string;
        textColor: string;
        bgColor: string;
        helperText?: string;
        helperTextClickable?: string;
    }
> = {
    // Scouts - Boosts
    [SubheaderTypeEnum.SocialBadge]: {
        title: 'Social Boosts',
        IconComponent: BlueBoostOutline2,
        iconColor: 'text-sp-blue-dark-ocean',
        textColor: 'text-white',
        bgColor: 'bg-sp-blue-ocean',
        helperText: 'Showcase your',
        helperTextClickable: 'social milestones',
    },

    // Scouts - Troops
    [SubheaderTypeEnum.Membership]: {
        title: 'Troops',
        IconComponent: GreenScoutsPledge2,
        iconColor: 'text-sp-green-forest-dark',
        textColor: 'text-white',
        bgColor: 'bg-sp-green-forest',
        helperText: 'Access your',
        helperTextClickable: 'troop affiliations',
    },

    // Scouts - Merit Badges
    [SubheaderTypeEnum.MeritBadge]: {
        title: 'Merit Badges',
        IconComponent: PurpleMeritBadgesIcon,
        iconColor: 'text-sp-purple-base',
        textColor: 'text-white',
        bgColor: 'bg-sp-purple-base',
        helperText: 'Collect your',
        helperTextClickable: 'scouting achievements',
    },

    // Scouts - Skills
    [SubheaderTypeEnum.Skill]: {
        title: 'Competencies Hub',
        IconComponent: SkillsIconWithShape,
        iconColor: 'text-indigo-500',
        textColor: 'text-grayscale-900',
        bgColor: 'bg-white',
        helperText: 'Your',
        helperTextClickable: 'competency roadmap.',
    },

    // Not currently used in Scouts
    [SubheaderTypeEnum.Currency]: {
        title: 'Currencies',
        IconComponent: Coins,
        iconColor: 'text-cyan-700',
        textColor: 'text-white',
        bgColor: 'bg-cyan-700',
    },
    [SubheaderTypeEnum.ID]: {
        title: 'IDs',
        IconComponent: IDIcon,
        iconColor: 'text-yellow-400',
        textColor: 'text-white',
        bgColor: 'bg-yellow-400',
    },
    [SubheaderTypeEnum.Achievement]: {
        title: 'Achievements',
        IconComponent: Trophy,
        iconColor: 'text-spice-400',
        textColor: 'text-white',
        bgColor: 'bg-spice-400',
    },
    [SubheaderTypeEnum.Job]: {
        title: 'Work History',
        IconComponent: Briefcase,
        iconColor: 'text-rose-400',
        textColor: 'text-white',
        bgColor: 'bg-rose-400',
    },
    [SubheaderTypeEnum.Learning]: {
        title: 'Learning History',
        IconComponent: Graduation,
        iconColor: 'text-emerald-700',
        textColor: 'text-white',
        bgColor: 'bg-emerald-700',
    },
    [SubheaderTypeEnum.default]: {
        title: '',
        IconComponent: null,
        iconColor: '',
        textColor: '',
        bgColor: '',
    },
};

export const credentialCategoryToSubheaderType = (category: CredentialCategoryEnum) => {
    switch (category) {
        case CredentialCategoryEnum.meritBadge:
            return SubheaderTypeEnum.MeritBadge;
        case CredentialCategoryEnum.membership:
            return SubheaderTypeEnum.Membership;
        case CredentialCategoryEnum.socialBadge:
        default:
            return SubheaderTypeEnum.SocialBadge;
    }
};
