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
import * as m from '../../paraglide/messages.js';

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

export type SubheaderCopy = {
    title: string;
    helperText?: string;
    helperTextClickable?: string;
};

// Resolved at call time (render) so the active locale is honored on every switch.
export const getSubheaderCopy = (type: SubheaderTypeEnum): SubheaderCopy => {
    switch (type) {
        case SubheaderTypeEnum.SocialBadge:
            return {
                title: m['mainSubheader.socialBadge.title'](),
                helperText: m['mainSubheader.socialBadge.helper'](),
                helperTextClickable: m['mainSubheader.socialBadge.helperAction'](),
            };
        case SubheaderTypeEnum.Membership:
            return {
                title: m['mainSubheader.membership.title'](),
                helperText: m['mainSubheader.membership.helper'](),
                helperTextClickable: m['mainSubheader.membership.helperAction'](),
            };
        case SubheaderTypeEnum.MeritBadge:
            return {
                title: m['mainSubheader.meritBadge.title'](),
                helperText: m['mainSubheader.meritBadge.helper'](),
                helperTextClickable: m['mainSubheader.meritBadge.helperAction'](),
            };
        case SubheaderTypeEnum.Skill:
            return {
                title: m['mainSubheader.skill.title'](),
                helperText: m['mainSubheader.skill.helper'](),
                helperTextClickable: m['mainSubheader.skill.helperAction'](),
            };
        case SubheaderTypeEnum.Currency:
            return { title: m['mainSubheader.currency.title']() };
        case SubheaderTypeEnum.ID:
            return { title: m['mainSubheader.id.title']() };
        case SubheaderTypeEnum.Achievement:
            return { title: m['mainSubheader.achievement.title']() };
        case SubheaderTypeEnum.Job:
            return { title: m['mainSubheader.job.title']() };
        case SubheaderTypeEnum.Learning:
            return { title: m['mainSubheader.learning.title']() };
        case SubheaderTypeEnum.default:
        default:
            return { title: '' };
    }
};

export const SubheaderContentType: Record<
    SubheaderTypeEnum,
    {
        IconComponent: React.FC<{ className?: string }> | null;
        iconColor: string;
        textColor: string;
        bgColor: string;
    }
> = {
    // Scouts - Boosts
    [SubheaderTypeEnum.SocialBadge]: {
        IconComponent: BlueBoostOutline2,
        iconColor: 'text-sp-blue-dark-ocean',
        textColor: 'text-white',
        bgColor: 'bg-sp-blue-ocean',
    },

    // Scouts - Troops
    [SubheaderTypeEnum.Membership]: {
        IconComponent: GreenScoutsPledge2,
        iconColor: 'text-sp-green-forest-dark',
        textColor: 'text-white',
        bgColor: 'bg-sp-green-forest',
    },

    // Scouts - Merit Badges
    [SubheaderTypeEnum.MeritBadge]: {
        IconComponent: PurpleMeritBadgesIcon,
        iconColor: 'text-sp-purple-base',
        textColor: 'text-white',
        bgColor: 'bg-sp-purple-base',
    },

    // Scouts - Skills
    [SubheaderTypeEnum.Skill]: {
        IconComponent: SkillsIconWithShape,
        iconColor: 'text-indigo-500',
        textColor: 'text-grayscale-900',
        bgColor: 'bg-white',
    },

    // Not currently used in Scouts
    [SubheaderTypeEnum.Currency]: {
        IconComponent: Coins,
        iconColor: 'text-cyan-700',
        textColor: 'text-white',
        bgColor: 'bg-cyan-700',
    },
    [SubheaderTypeEnum.ID]: {
        IconComponent: IDIcon,
        iconColor: 'text-yellow-400',
        textColor: 'text-white',
        bgColor: 'bg-yellow-400',
    },
    [SubheaderTypeEnum.Achievement]: {
        IconComponent: Trophy,
        iconColor: 'text-spice-400',
        textColor: 'text-white',
        bgColor: 'bg-spice-400',
    },
    [SubheaderTypeEnum.Job]: {
        IconComponent: Briefcase,
        iconColor: 'text-rose-400',
        textColor: 'text-white',
        bgColor: 'bg-rose-400',
    },
    [SubheaderTypeEnum.Learning]: {
        IconComponent: Graduation,
        iconColor: 'text-emerald-700',
        textColor: 'text-white',
        bgColor: 'bg-emerald-700',
    },
    [SubheaderTypeEnum.default]: {
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
