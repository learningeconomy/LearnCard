import { NotificationTypeEnum } from '../../constants/notifications';

export interface NotificationIssuerMeta {
    image?: string;
    fullName?: string;
    profileId?: string;
    displayName?: string;
}

export type NotificationBoostCardProps = {
    className?: string;
    thumbImage?: string;
    customThumbComponent?: React.ReactNode;
    notificationType: NotificationTypeEnum;
    issuerInfo?: NotificationIssuerMeta;
    issueDate?: string;
    handleButtonClick?: ()=> void;
    handleCancelClick?: ()=> void;
    handleCardClick?: () => void;
    claimStatus: boolean;
    loadingState?: boolean;
    showIssuerInfo?: boolean;
    title?: string;
    isArchived?: boolean;
}
