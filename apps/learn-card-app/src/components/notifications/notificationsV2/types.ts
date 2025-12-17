import { CredentialCategory, CredentialCategoryEnum } from 'learn-card-base';

export enum NotificationTypeEnum {
    Currency = 'currency',
    ID = 'id',
    Achievement = 'achievement',
    Skill = 'skill',
    Job = 'job',
    Learning = 'learning',
    SocialBadges = 'socialBadge',
    Loading = 'loading',
    Membership = 'membership',
    WorkHistory = 'workHistory',
    Family = 'family',

    accomplishment = 'Accomplishment',
    accommodation = 'Accommodation',

    consentFlowTransaction = 'consentFlowTransaction',
}

export enum UserNotificationTypeEnum {
    ConnectionRequest = 'connection',
    AcceptedBoost = 'acceptedBoost',
}

export interface NotificationIssuerMeta {
    image?: string;
    fullName?: string;
    profileId?: string;
    displayName?: string;
}

export type NotificationProps = {
    notificationType: NotificationTypeEnum;
    title: string;
    issuerImage?: string;
    issueDate: string;
    className?: string;
    handleViewOnClick: () => void;
    claimStatus: boolean;
    handleClaimOnClick: () => void;
    loadingState: boolean;
};

export const CATEGORY_TO_NOTIFICATION_ENUM = {
    [CredentialCategoryEnum.socialBadge]: NotificationTypeEnum.SocialBadges,
    [CredentialCategoryEnum.achievement]: NotificationTypeEnum.Achievement,
    [CredentialCategoryEnum.learningHistory]: NotificationTypeEnum.Learning,
    [CredentialCategoryEnum.workHistory]: NotificationTypeEnum.WorkHistory,
    [CredentialCategoryEnum.id]: NotificationTypeEnum.ID,
    [CredentialCategoryEnum.skill]: NotificationTypeEnum.Skill,
    [CredentialCategoryEnum.membership]: NotificationTypeEnum.Membership,
    [CredentialCategoryEnum.accommodation]: NotificationTypeEnum.accommodation,
    [CredentialCategoryEnum.accomplishment]: NotificationTypeEnum.accomplishment,
    [CredentialCategoryEnum.family]: NotificationTypeEnum.Family,
};

export const NotificationTypeStyles: {
    [key: NotificationTypeEnum | string]: {
        viewButtonStyles: string;
        unclaimedButtonStyles: string;
        claimedButtonStyles: string;
        textStyles: string;
        iconCircleStyles: string;
        typeText: string;
    };
} = {
    [NotificationTypeEnum.Currency]: {
        viewButtonStyles: 'border-cyan-400 text-cyan-700',
        unclaimedButtonStyles: 'text-white bg-cyan-700 border-cyan-700 shadow-bottom',
        claimedButtonStyles: 'text-cyan-700 bg-cyan-50 border-cyan-50 cursor-default',
        textStyles: 'text-cyan-700 capitalize',
        iconCircleStyles: 'bg-cyan-700',
        typeText: 'Currency',
    },
    [NotificationTypeEnum.SocialBadges]: {
        viewButtonStyles: 'border-blue-700 text-blue-700',
        unclaimedButtonStyles: 'text-white bg-blue-700 border-blue-700 shadow-bottom',
        claimedButtonStyles: 'text-blue-700 bg-blue-50 border-blue-50 cursor-default',
        textStyles: 'text-blue-700 capitalize',
        iconCircleStyles: 'bg-blue-700',
        typeText: 'Boost',
    },
    [NotificationTypeEnum.ID]: {
        viewButtonStyles: 'border-blue-400 text-blue-400',
        unclaimedButtonStyles: 'text-white bg-blue-400 border-blue-400 shadow-bottom',
        claimedButtonStyles: 'text-blue-400 bg-blue-100 border-blue-100 cursor-default',
        textStyles: 'text-blue-400 normal',
        iconCircleStyles: 'bg-blue-400',
        typeText: 'ID',
    },
    [NotificationTypeEnum.Achievement]: {
        viewButtonStyles: 'border-pink-600 text-pink-400',
        unclaimedButtonStyles: 'text-white bg-pink-400 border-pink-400 shadow-bottom',
        claimedButtonStyles: 'text-pink-400 bg-pink-50 border-pink-50 cursor-default',
        textStyles: 'text-pink-400 capitalize',
        iconCircleStyles: 'bg-pink-400',
        typeText: 'Achievement',
    },
    [NotificationTypeEnum.Skill]: {
        viewButtonStyles: 'border-indigo-400 text-indigo-400',
        unclaimedButtonStyles: 'text-white bg-indigo-400 border-indigo-400 shadow-bottom',
        claimedButtonStyles: 'text-indigo-400 bg-indigo-50 border-indigo-50 cursor-default',
        textStyles: 'text-indigo-400 capitalize',
        iconCircleStyles: 'bg-indigo-400',
        typeText: 'Skill',
    },
    [NotificationTypeEnum.WorkHistory]: {
        viewButtonStyles: 'border-cyan-400 text-cyan-400',
        unclaimedButtonStyles: 'text-white bg-cyan-400 border-cyan-400 shadow-bottom',
        claimedButtonStyles: 'text-cyan-400 bg-cyan-50 border-cyan-50 cursor-default',
        textStyles: 'text-cyan-400 capitalize',
        iconCircleStyles: 'bg-cyan-400',
        typeText: 'Experience',
    },
    [NotificationTypeEnum.Learning]: {
        viewButtonStyles: 'border-emerald-500 text-emerald-500',
        unclaimedButtonStyles: 'text-white bg-emerald-500 border-emerald-500 shadow-bottom',
        claimedButtonStyles: 'text-emerald-500 bg-emerald-50 border-emerald-50 cursor-default',
        textStyles: 'text-emerald-500 capitalize',
        iconCircleStyles: 'bg-emerald-500',
        typeText: 'Studies',
    },
    [NotificationTypeEnum.Membership]: {
        viewButtonStyles: 'border-teal-500 text-teal-500',
        unclaimedButtonStyles: 'text-white bg-teal-500 border-teal-500 shadow-bottom',
        claimedButtonStyles: 'text-teal-500 bg-teal-50 border-teal-50 cursor-default',
        textStyles: 'text-teal-500 capitalize',
        iconCircleStyles: 'bg-teal-500',
        typeText: 'Membership',
    },
    [NotificationTypeEnum.accomplishment]: {
        viewButtonStyles: 'border-yellow-500 text-yellow-500',
        unclaimedButtonStyles: 'text-white bg-yellow-500 border-yellow-500 shadow-bottom',
        claimedButtonStyles: 'text-yellow-500 bg-yellow-50 border-yellow-50 cursor-default',
        textStyles: 'text-yellow-500 capitalize',
        iconCircleStyles: 'bg-yellow-500',
        typeText: 'Portfolio',
    },
    [NotificationTypeEnum.accommodation]: {
        viewButtonStyles: 'border-violet-500 text-violet-500',
        unclaimedButtonStyles: 'text-white bg-violet-500 border-violet-500 shadow-bottom',
        claimedButtonStyles: 'text-violet-500 bg-violet-50 border-violet-50 cursor-default',
        textStyles: 'text-violet-500 capitalize',
        iconCircleStyles: 'bg-violet-500',
        typeText: 'Assistance',
    },
    [NotificationTypeEnum.Family]: {
        viewButtonStyles: 'border-amber-500 text-amber-500',
        unclaimedButtonStyles: 'text-white bg-amber-500 border-amber-500 shadow-bottom',
        claimedButtonStyles: 'text-amber-500 bg-amber-50 border-amber-50 cursor-default',
        textStyles: 'text-amber-500 capitalize',
        iconCircleStyles: 'bg-amber-500',
        typeText: 'Family',
    },
    [NotificationTypeEnum.Loading]: {
        viewButtonStyles: 'border-white-50 text-white-50',
        unclaimedButtonStyles: 'text-white bg-grayscale-100 border-grayscale-100 ',
        claimedButtonStyles: 'text-white bg-white-50 border-white-50 cursor-default',
        textStyles: 'text-grayscale-500 capitalize',
        iconCircleStyles: 'bg-grayscale-100',
        typeText: 'Loading...',
    },
    [NotificationTypeEnum.consentFlowTransaction]: {
        viewButtonStyles: 'border-white-50 text-white-50',
        unclaimedButtonStyles: 'text-white bg-grayscale-100 border-grayscale-100 ',
        claimedButtonStyles: 'text-white bg-white-50 border-white-50 cursor-default',
        textStyles: 'text-grayscale-500 capitalize',
        iconCircleStyles: 'bg-grayscale-100',
        typeText: 'Consent Flow Transaction',
    },
    ['endorsement']: {
        viewButtonStyles: 'border-emerald-700 text-emerald-700',
        unclaimedButtonStyles: 'text-white bg-emerald-700 border-emerald-700 ',
        claimedButtonStyles: 'text-emerald-700 bg-emerald-50 border-emerald-50 cursor-default',
        textStyles: 'text-indigo-600 capitalize',
        iconCircleStyles: 'bg-emerald-700',
        typeText: 'Endorsement',
    },
};

export const UserNotificationTypeStyles: {
    [key: UserNotificationTypeEnum | string]: {
        viewButtonStyles: string;
        unclaimedButtonStyles: string;
        claimedButtonStyles: string;
        textStyles: string;
        iconCircleStyles: string;
        typeText?: string;
    };
} = {
    [UserNotificationTypeEnum.ConnectionRequest]: {
        viewButtonStyles: 'border-indigo-600 text-indigo-400',
        unclaimedButtonStyles: 'text-white bg-indigo-600 border-indigo-600 shadow-bottom',
        claimedButtonStyles: 'text-indigo-600 bg-indigo-50 border-indigo-50 cursor-default',
        textStyles: 'text-indigo-600 capitalize',
        iconCircleStyles: 'bg-indigo-600',
        typeText: 'Invitation',
    },
    [UserNotificationTypeEnum.AcceptedBoost]: {
        viewButtonStyles: 'border-indigo-600 text-indigo-400',
        unclaimedButtonStyles: 'text-white bg-indigo-600 border-indigo-600 shadow-bottom',
        claimedButtonStyles: 'text-indigo-600 bg-indigo-50 border-indigo-50',
        textStyles: 'text-indigo-600 capitalize',
        iconCircleStyles: 'bg-indigo-600',
        typeText: 'Boost',
    },
};
