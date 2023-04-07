import { UserNotificationTypeEnum } from '../../constants/notifications';

export type NotificationUserCardProps = {
    className?: string;
    thumbImage?: string;
    customThumbComponent?: React.ReactNode;
    notificationType?: UserNotificationTypeEnum;
    issueDate?: string;
    handleButtonClick?: () => void;
    handleCancelClick?: () => void;
    handleCardClick?: () => void;
    acceptStatus: boolean;
    loadingState?: boolean;
    showIssuerInfo?: boolean;
    title?: string;
    isArchived?: boolean;
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
        claimedButtonStyles: 'text-indigo-600 bg-indigo-50 border-indigo-50',
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
    },
};
