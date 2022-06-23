import { NotificationTypeEnum } from '../../constants/notifications';
import { Icons } from '../../types';
import { ICONS_TO_SOURCE } from '../../constants/icons';

export type NotificationProps = {
    notificationType: NotificationTypeEnum;
    title: string;
    issuerImage?: string;
    issuerName: string;
    issueDate: string;
    className?: string;
    onClick: () => void;
};

export enum NotificationStatusEnum {
    Claimed = 'claimed',
    Unclaimed = 'unclaimed',
}

export const NotificationTypeStyles = {
    [NotificationTypeEnum.Currency]: {
        viewButtonStyles: 'border-cyan-400 text-cyan-400',
        unclaimedButtonStyles: 'text-white bg-cyan-400 border-cyan-400',
        claimedButtonStyles: 'text-cyan-400 bg-cyan-50 border-cyan-50',
        textStyles: 'text-cyan-400',
        icon: ICONS_TO_SOURCE[Icons.coinsWhiteIcon],
        iconCircleStyles: 'bg-cyan-400',
    },
    [NotificationTypeEnum.Identification]: {
        viewButtonStyles: 'border-yellow-400 text-yellow-400',
        unclaimedButtonStyles: 'text-white bg-yellow-400 border-yellow-400',
        claimedButtonStyles: 'text-yellow-400 bg-yellow-50 border-yellow-50',
        textStyles: 'text-yellow-400',
        icon: ICONS_TO_SOURCE[Icons.userIcon],
        iconCircleStyles: 'bg-yellow-400',
    },
    [NotificationTypeEnum.Achievement]: {
        viewButtonStyles: 'border-spice-400 text-spice-400',
        unclaimedButtonStyles: 'text-white bg-spice-400 border-spice-400',
        claimedButtonStyles: 'text-spice-400 bg-spice-50 border-spice-50',
        textStyles: 'text-spice-400',
        icon: ICONS_TO_SOURCE[Icons.trophyWhiteIcon],
        iconCircleStyles: 'bg-spice-400',
    },
    [NotificationTypeEnum.Skill]: {
        viewButtonStyles: 'border-indigo-400 text-indigo-400',
        unclaimedButtonStyles: 'text-white bg-indigo-400 border-indigo-400',
        claimedButtonStyles: 'text-indigo-400 bg-indigo-50 border-indigo-50',
        textStyles: 'text-indigo-400',
        icon: ICONS_TO_SOURCE[Icons.lightbulbWhiteIcon],
        iconCircleStyles: 'bg-indigo-400',
    },
    [NotificationTypeEnum.Job]: {
        viewButtonStyles: 'border-emerald-400 text-emerald-400',
        unclaimedButtonStyles: 'text-white bg-emerald-400 border-emerald-400',
        claimedButtonStyles: 'text-emerald-400 bg-emerald-50 border-emerald-50',
        textStyles: 'text-emerald-400',
        icon: ICONS_TO_SOURCE[Icons.briefcaseWhiteIcon],
        iconCircleStyles: 'bg-emerald-400',
    },
    [NotificationTypeEnum.Learning]: {
        viewButtonStyles: 'border-rose-400 text-rose-400',
        unclaimedButtonStyles: 'text-white bg-rose-400 border-rose-400',
        claimedButtonStyles: 'text-rose-400 bg-rose-50 border-rose-50',
        textStyles: 'text-rose-400',
        icon: ICONS_TO_SOURCE[Icons.graduationWhiteIcon],
        iconCircleStyles: 'bg-rose-400',
    },
};
