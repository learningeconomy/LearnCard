import type { UserNotificationTypeEnum } from '../../constants/notifications';

export type NotificationUserAcceptedBoostCardProps = {
    className?: string;
    thumbImage?: string;
    customThumbComponent?: React.ReactNode;
    notificationType?: UserNotificationTypeEnum.AcceptedBoost;
    issueDate?: string;
    handleCancelClick?: () => void;
    loadingState?: boolean;
    title?: string;
    isArchived?: boolean;
};
