import { CredentialCategory, CredentialCategoryEnum } from 'learn-card-base';

export enum NotificationTypeEnum {
    Currency = 'currency',
    ID = 'id',
    Achievement = 'achievement',
    Skill = 'skill',
    Job = 'job',
    Learning = 'learning',
    SocialBadges = 'socialBadge',
    Membership = 'membership',
    Loading = 'loading',
    MeritBadge = 'meritBadge',

    // troops 2.0 ID categories
    globalAdminId = 'Global Admin ID',
    nationalNetworkAdminId = 'National Network Admin ID',
    troopLeaderId = 'Troop Leader ID',
    scoutId = 'Scout ID',
    // troops 2.0 ID categories
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
    [CredentialCategoryEnum.workHistory]: NotificationTypeEnum.Job,
    [CredentialCategoryEnum.id]: NotificationTypeEnum.ID,
    [CredentialCategoryEnum.skill]: NotificationTypeEnum.Skill,
    [CredentialCategoryEnum.membership]: NotificationTypeEnum.Membership,
    [CredentialCategoryEnum.globalAdminId]: NotificationTypeEnum.globalAdminId,
    [CredentialCategoryEnum.nationalNetworkAdminId]: NotificationTypeEnum.nationalNetworkAdminId,
    [CredentialCategoryEnum.troopLeaderId]: NotificationTypeEnum.troopLeaderId,
    [CredentialCategoryEnum.scoutId]: NotificationTypeEnum.scoutId,
    [CredentialCategoryEnum.meritBadge]: NotificationTypeEnum.MeritBadge,
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
        viewButtonStyles: 'border-sp-blue-dark-ocean text-sp-blue-dark-ocean',
        unclaimedButtonStyles:
            'text-white bg-sp-blue-dark-ocean border-sp-blue-dark-ocean shadow-bottom',
        claimedButtonStyles:
            'text-sp-blue-dark-ocean bg-sp-blue-ocean border-sp-blue-ocean cursor-default',
        textStyles: 'text-sp-blue-dark-ocean capitalize',
        iconCircleStyles: 'bg-sp-blue-dark-ocean',
        typeText: 'Boost',
    },
    [NotificationTypeEnum.ID]: {
        viewButtonStyles: 'border-yellow-400 text-yellow-400',
        unclaimedButtonStyles: 'text-white bg-yellow-400 border-yellow-400 shadow-bottom',
        claimedButtonStyles: 'text-yellow-400 bg-yellow-50 border-yellow-50 cursor-default',
        textStyles: 'text-yellow-400 uppercase',
        iconCircleStyles: 'bg-yellow-400',
        typeText: 'ID',
    },
    [NotificationTypeEnum.Membership]: {
        viewButtonStyles: 'border-sp-green-base text-sp-green-base',
        unclaimedButtonStyles: 'text-white bg-sp-green-base border-sp-green-base shadow-bottom',
        claimedButtonStyles:
            'text-sp-green-base bg-sp-green-light border-sp-green-light cursor-default',
        textStyles: 'text-sp-green-base capitalize',
        iconCircleStyles: 'bg-sp-green-base',
        typeText: 'Troop',
    },

    [NotificationTypeEnum.globalAdminId]: {
        viewButtonStyles: 'border-sp-green-base text-sp-green-base',
        unclaimedButtonStyles: 'text-white bg-sp-green-base border-sp-green-base shadow-bottom',
        claimedButtonStyles:
            'text-sp-green-base bg-sp-green-light border-sp-green-light cursor-default',
        textStyles: 'text-sp-green-base capitalize',
        iconCircleStyles: 'bg-sp-green-base',
        typeText: 'Global Admin ID',
    },
    [NotificationTypeEnum.nationalNetworkAdminId]: {
        viewButtonStyles: 'border-sp-green-base text-sp-green-base',
        unclaimedButtonStyles: 'text-white bg-sp-green-base border-sp-green-base shadow-bottom',
        claimedButtonStyles:
            'text-sp-green-base bg-sp-green-light border-sp-green-light cursor-default',
        textStyles: 'text-sp-green-base capitalize',
        iconCircleStyles: 'bg-sp-green-base',
        typeText: 'Network Admin',
    },
    [NotificationTypeEnum.troopLeaderId]: {
        viewButtonStyles: 'border-sp-green-base text-sp-green-base',
        unclaimedButtonStyles: 'text-white bg-sp-green-base border-sp-green-base shadow-bottom',
        claimedButtonStyles:
            'text-sp-green-base bg-sp-green-light border-sp-green-light cursor-default',
        textStyles: 'text-sp-green-base capitalize',
        iconCircleStyles: 'bg-sp-green-base',
        typeText: 'Troop Leader ID',
    },
    [NotificationTypeEnum.scoutId]: {
        viewButtonStyles: 'border-sp-green-base text-sp-green-base',
        unclaimedButtonStyles: 'text-white bg-sp-green-base border-sp-green-base shadow-bottom',
        claimedButtonStyles:
            'text-sp-green-base bg-sp-green-light border-sp-green-light cursor-default',
        textStyles: 'text-sp-green-base capitalize',
        iconCircleStyles: 'bg-sp-green-base',
        typeText: 'Scout ID',
    },
    [NotificationTypeEnum.Achievement]: {
        viewButtonStyles: 'border-spice-600 text-spice-400',
        unclaimedButtonStyles: 'text-white bg-spice-400 border-spice-400 shadow-bottom',
        claimedButtonStyles: 'text-spice-400 bg-spice-50 border-spice-50 cursor-default',
        textStyles: 'text-spice-400 capitalize',
        iconCircleStyles: 'bg-spice-400',
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
    [NotificationTypeEnum.Job]: {
        viewButtonStyles: 'border-rose-400 text-rose-400',
        unclaimedButtonStyles: 'text-white bg-rose-400 border-rose-400 shadow-bottom',
        claimedButtonStyles: 'text-rose-400 bg-rose-50 border-rose-50 cursor-default',
        textStyles: 'text-rose-400 capitalize',
        iconCircleStyles: 'bg-rose-400',
        typeText: 'Work History',
    },
    [NotificationTypeEnum.Learning]: {
        viewButtonStyles: 'border-emerald-500 text-emerald-500',
        unclaimedButtonStyles: 'text-white bg-emerald-500 border-emerald-500 shadow-bottom',
        claimedButtonStyles: 'text-emerald-500 bg-emerald-50 border-emerald-50 cursor-default',
        textStyles: 'text-emerald-500 capitalize',
        iconCircleStyles: 'bg-emerald-500',
        typeText: 'Learning History',
    },
    [NotificationTypeEnum.Loading]: {
        viewButtonStyles: 'border-white-50 text-white-50',
        unclaimedButtonStyles: 'text-white bg-grayscale-100 border-grayscale-100 ',
        claimedButtonStyles: 'text-white bg-white-50 border-white-50 cursor-default',
        textStyles: 'text-grayscale-500 capitalize',
        iconCircleStyles: 'bg-grayscale-100',
        typeText: 'Loading...',
    },
    [NotificationTypeEnum.MeritBadge]: {
        viewButtonStyles: 'border-sp-purple-base text-sp-purple-base',
        unclaimedButtonStyles: 'text-white bg-sp-purple-base border-sp-purple-base shadow-bottom',
        claimedButtonStyles:
            'text-sp-purple-base bg-sp-purple-light border-sp-purple-light cursor-default',
        textStyles: 'text-sp-purple-base capitalize',
        iconCircleStyles: 'bg-sp-purple-base',
        typeText: 'Merit Badge',
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
