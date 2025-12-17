import React from 'react';

import Coins from 'learn-card-base/svgs/Coins';
import User from 'learn-card-base/svgs/User';
import Graduation from 'learn-card-base/svgs/Graduation';
import KeyIcon from 'learn-card-base/svgs/KeyIcon';

import { CredentialCategoryEnum } from 'learn-card-base';

import { WalletIcons } from 'learn-card-base';
import IDsIcon from 'learn-card-base/svgs/wallet/IDsIcon';

const {
    AiSessionsIcon,
    AiPathwaysIcon,
    AiInsightsIcon,
    SkillsIcon,
    BoostsIcon,
    AchievementsIcon,
    StudiesIcon,
    PortfolioIcon,
    AssistanceIcon,
    ExperiencesIcon,
    FamiliesIcon,
} = WalletIcons;

export enum SubheaderTypeEnum {
    Learning = 'learning',
    SocialBadge = 'socialBadge',
    Achievement = 'achievement',
    Accomplishment = 'accomplishment',
    Skill = 'skill',
    AiInsights = 'aiInsights',
    Experience = 'experience',
    Accommodation = 'accommodation',
    Family = 'family',

    // todo
    Relationship = 'relationship',
    Membership = 'membership',
    Goals = 'goals',
    Events = 'events',

    // deprecated
    Currency = 'currency',
    ID = 'id',
    Job = 'job',
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
        iconPadding?: string;
        textColor: string;
        bgColor: string;
        helperText?: string;
        helperTextClickable?: string;
    }
> = {
    [SubheaderTypeEnum.Learning]: {
        title: 'Studies',
        IconComponent: StudiesIcon,
        iconColor: 'text-emerald-701',
        iconPadding: 'py-[6px] px-[8px]',
        textColor: 'text-white',
        bgColor: 'bg-emerald-401',
        helperText: 'Your',
        helperTextClickable: 'learning journey',
    },
    [SubheaderTypeEnum.SocialBadge]: {
        title: 'Boosts',
        IconComponent: BoostsIcon,
        iconColor: 'text-blue-700',
        iconPadding: 'pt-[3.75px] pr-[6.75px] pb-[4.622px] pl-[5.75px]',
        textColor: 'text-white',
        bgColor: 'bg-blue-400',
        helperText: 'Your',
        helperTextClickable: 'social milestones',
    },
    [SubheaderTypeEnum.Achievement]: {
        title: 'Achievements',
        IconComponent: AchievementsIcon,
        iconColor: 'text-pink-700',
        iconPadding: 'p-0',
        textColor: 'text-white',
        bgColor: 'bg-pink-400',
        helperText: 'Your',
        helperTextClickable: 'proudest moments',
    },
    [SubheaderTypeEnum.Accomplishment]: {
        title: 'Portfolio',
        IconComponent: PortfolioIcon,
        iconColor: 'text-yellow-700',
        iconPadding: 'pt-[4px] pr-[5px] pb-[5px] pl-[5px]',
        textColor: 'text-white',
        bgColor: 'bg-yellow-400',
        helperText: 'Your',
        helperTextClickable: 'accomplishments',
    },
    [SubheaderTypeEnum.Skill]: {
        title: 'Skills',
        IconComponent: SkillsIcon,
        iconColor: 'text-indigo-500',
        textColor: 'text-white',
        bgColor: 'bg-white',
        helperText: 'Your',
        helperTextClickable: 'expertise',
    },
    [SubheaderTypeEnum.AiInsights]: {
        title: 'AI Insights',
        IconComponent: AiInsightsIcon,
        iconColor: 'text-lime-700',
        textColor: 'text-white',
        bgColor: 'bg-white',
        helperText: 'Your',
        helperTextClickable: 'AI insights',
    },
    [SubheaderTypeEnum.Job]: {
        title: 'Experiences',
        IconComponent: ExperiencesIcon,
        iconColor: 'text-cyan-701',
        iconPadding: 'py-[6.75px] px-[5.75px]',
        textColor: 'text-white',
        bgColor: 'bg-cyan-401',
        helperText: 'Your',
        helperTextClickable: 'work experiences',
    },
    [SubheaderTypeEnum.Experience]: {
        title: 'Experiences',
        IconComponent: ExperiencesIcon,
        iconColor: 'text-cyan-701',
        iconPadding: 'py-[6.75px] px-[5.75px]',
        textColor: 'text-white',
        bgColor: 'bg-cyan-401',
        helperText: 'Your',
        helperTextClickable: 'work experiences',
    },
    [SubheaderTypeEnum.Accommodation]: {
        title: 'Assistance',
        IconComponent: AssistanceIcon,
        iconColor: 'text-violet-700',
        iconPadding: 'p-[7px]',
        textColor: 'text-white',
        bgColor: 'bg-violet-400',
        helperText: 'Your',
        helperTextClickable: 'support and adjustments',
    },
    [SubheaderTypeEnum.ID]: {
        title: 'IDs',
        IconComponent: IDsIcon,
        iconColor: 'text-blue-700',
        iconPadding: 'py-[10.75px] px-[6.55px]',
        textColor: 'text-white',
        bgColor: 'bg-blue-400',
        helperText: 'Your',
        helperTextClickable: 'identification',
    },
    [SubheaderTypeEnum.Family]: {
        title: 'Families',
        IconComponent: FamiliesIcon,
        iconColor: 'text-amber-700',
        iconPadding: 'p-[7.75px]',
        textColor: 'text-white',
        bgColor: 'bg-amber-400',
        helperText: 'Your',
        helperTextClickable: "family's learning progress",
    },

    // todo
    [SubheaderTypeEnum.Relationship]: {
        title: 'Relationships',
        IconComponent: User,
        iconColor: 'text-yellow-400',
        textColor: 'text-white',
        bgColor: 'bg-yellow-400',
        helperText: 'Keep track of important connections',
    },
    [SubheaderTypeEnum.Membership]: {
        title: 'Memberships',
        IconComponent: KeyIcon,
        iconColor: 'text-teal-400',
        textColor: 'text-white',
        bgColor: 'bg-teal-400',
    },
    [SubheaderTypeEnum.Goals]: {
        title: 'Goals',
        IconComponent: Graduation,
        iconColor: 'text-emerald-700',
        textColor: 'text-white',
        bgColor: 'bg-emerald-700',
        helperText: 'Set and track your personal goals',
    },
    [SubheaderTypeEnum.Events]: {
        title: 'Events',
        IconComponent: Graduation,
        iconColor: 'text-emerald-700',
        textColor: 'text-white',
        bgColor: 'bg-emerald-700',
        helperText: 'Keep track of important dates and activities',
    },

    // deprecated
    [SubheaderTypeEnum.Currency]: {
        title: 'Currencies',
        IconComponent: Coins,
        iconColor: 'text-cyan-700',
        textColor: 'text-white',
        bgColor: 'bg-cyan-700',
    },
    [SubheaderTypeEnum.default]: {
        title: '',
        IconComponent: null,
        iconColor: '',
        textColor: '',
        bgColor: '',
        helperText: '',
    },
};

export const credentialCategoryToSubheaderType = (category: CredentialCategoryEnum) => {
    switch (category) {
        case CredentialCategoryEnum.membership:
            return SubheaderTypeEnum.Membership;
        case CredentialCategoryEnum.learningHistory:
            return SubheaderTypeEnum.Learning;
        case CredentialCategoryEnum.achievement:
            return SubheaderTypeEnum.Achievement;
        case CredentialCategoryEnum.accomplishment:
            return SubheaderTypeEnum.Accomplishment;
        case CredentialCategoryEnum.skill:
            return SubheaderTypeEnum.Skill;
        case CredentialCategoryEnum.workHistory:
            return SubheaderTypeEnum.Experience;
        case CredentialCategoryEnum.accommodation:
            return SubheaderTypeEnum.Accommodation;
        case CredentialCategoryEnum.relationship:
            return SubheaderTypeEnum.Relationship;
        case CredentialCategoryEnum.id:
            return SubheaderTypeEnum.Membership;
        case CredentialCategoryEnum.goals:
            return SubheaderTypeEnum.Goals;
        case CredentialCategoryEnum.events:
            return SubheaderTypeEnum.Events;
        case CredentialCategoryEnum.currency:
            return SubheaderTypeEnum.Currency;
        case CredentialCategoryEnum.socialBadge:
        default:
            return SubheaderTypeEnum.SocialBadge;
    }
};
