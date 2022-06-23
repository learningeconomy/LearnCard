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
};

export enum NotificationStatusEnum {
    Claimed = 'claimed',
    Unclaimed = 'unclaimed',
}

export const NotificationTypeStyles = {
    [NotificationTypeEnum.Currency]: {
        viewButtonStyles: 'border-cyan-400 text-cyan-400',
        claimButtonStyles: 'bg-cyan-400 border-cyan-400',
        textStyles: 'text-cyan-400',
        icon: ICONS_TO_SOURCE[Icons.coinsWhiteIcon],
        iconCircleStyles: 'bg-cyan-400',
    },
    [NotificationTypeEnum.Identification]: {
        viewButtonStyles: 'border-yellow-400 text-yellow-400',
        claimButtonStyles: 'bg-yellow-400 border-yellow-400',
        textStyles: 'text-yellow-400',
        icon: ICONS_TO_SOURCE[Icons.userIcon],
        iconCircleStyles: 'bg-yellow-400',
    },
    [NotificationTypeEnum.Achievement]: {
        viewButtonStyles: 'border-spice-400 text-spice-400',
        claimButtonStyles: 'bg-spice-400 border-spice-400',
        textStyles: 'text-spice-400',
        icon: ICONS_TO_SOURCE[Icons.trophyWhiteIcon],
        iconCircleStyles: 'bg-spice-400',
    },
    [NotificationTypeEnum.Skill]: {
        viewButtonStyles: 'border-indigo-400 text-indigo-400',
        claimButtonStyles: 'bg-indigo-400 border-indigo-400',
        textStyles: 'text-indigo-400',
        icon: ICONS_TO_SOURCE[Icons.lightbulbWhiteIcon],
        iconCircleStyles: 'bg-indigo-400',
    },
    [NotificationTypeEnum.Job]: {
        viewButtonStyles: 'border-emerald-400 text-emerald-400',
        claimButtonStyles: 'bg-emerald-400 border-emerald-400',
        textStyles: 'text-emerald-400',
        icon: ICONS_TO_SOURCE[Icons.briefcaseWhiteIcon],
        iconCircleStyles: 'bg-emerald-400',
    },
    [NotificationTypeEnum.Learning]: {
        viewButtonStyles: 'border-rose-400 text-rose-400',
        claimButtonStyles: 'bg-rose-400 border-rose-400',
        textStyles: 'text-rose-400',
        icon: ICONS_TO_SOURCE[Icons.graduationWhiteIcon],
        iconCircleStyles: 'bg-rose-400',
    },
};
