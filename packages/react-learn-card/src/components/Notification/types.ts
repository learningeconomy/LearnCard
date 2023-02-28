import { NotificationTypeEnum } from '../../constants/notifications';

import Trophy from '../svgs/Trophy';
import Coins from '../svgs/Coins';
import User from '../svgs/User';
import Briefcase from '../svgs/Briefcase';
import Lightbulb from '../svgs/Lightbulb';
import Graduation from '../svgs/Graduation';
import AwardRibbon from '../svgs/AwardRibbon';

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

export const NotificationTypeStyles: {
    [key: NotificationTypeEnum | string]: {
        viewButtonStyles: string;
        unclaimedButtonStyles: string;
        claimedButtonStyles: string;
        textStyles: string;
        iconCircleStyles: string;
        IconComponent: any;
        typeText: string;
    };
} = {
    [NotificationTypeEnum.Currency]: {
        viewButtonStyles: 'border-cyan-600 text-cyan-600',
        unclaimedButtonStyles: 'text-white bg-cyan-600 border-cyan-600',
        claimedButtonStyles: 'text-cyan-600 bg-cyan-50 border-cyan-50',
        textStyles: 'text-cyan-600 capitalize',
        iconCircleStyles: 'bg-cyan-600',
        IconComponent: Coins,
        typeText: 'Currency',
    },
    [NotificationTypeEnum.SocialBadges]: {
        viewButtonStyles: 'border-cyan-600 text-cyan-600',
        unclaimedButtonStyles: 'text-white bg-cyan-600 border-cyan-600',
        claimedButtonStyles: 'text-cyan-600 bg-cyan-50 border-cyan-50',
        textStyles: 'text-cyan-600 capitalize',
        iconCircleStyles: 'bg-cyan-600',
        IconComponent: AwardRibbon,
        typeText: 'Social Badge',
    },
    [NotificationTypeEnum.ID]: {
        viewButtonStyles: 'border-yellow-400 text-yellow-400',
        unclaimedButtonStyles: 'text-white bg-yellow-400 border-yellow-400',
        claimedButtonStyles: 'text-yellow-400 bg-yellow-50 border-yellow-50',
        textStyles: 'text-yellow-400 uppercase',
        iconCircleStyles: 'bg-yellow-400',
        IconComponent: User,
        typeText: 'ID',
    },
    [NotificationTypeEnum.Achievement]: {
        viewButtonStyles: 'border-spice-400 text-spice-400',
        unclaimedButtonStyles: 'text-white bg-spice-400 border-spice-400',
        claimedButtonStyles: 'text-spice-400 bg-spice-50 border-spice-50',
        textStyles: 'text-spice-400 capitalize',
        iconCircleStyles: 'bg-spice-400',
        IconComponent: Trophy,
        typeText: 'Achievement',
    },
    [NotificationTypeEnum.Skill]: {
        viewButtonStyles: 'border-indigo-400 text-indigo-400',
        unclaimedButtonStyles: 'text-white bg-indigo-400 border-indigo-400',
        claimedButtonStyles: 'text-indigo-400 bg-indigo-50 border-indigo-50',
        textStyles: 'text-indigo-400 capitalize',
        iconCircleStyles: 'bg-indigo-400',
        IconComponent: Lightbulb,
        typeText: 'Skill',
    },
    [NotificationTypeEnum.Job]: {
        viewButtonStyles: 'border-emerald-400 text-emerald-400',
        unclaimedButtonStyles: 'text-white bg-emerald-400 border-emerald-400',
        claimedButtonStyles: 'text-emerald-400 bg-emerald-50 border-emerald-50',
        textStyles: 'text-emerald-400 capitalize',
        iconCircleStyles: 'bg-emerald-400',
        IconComponent: Briefcase,
        typeText: 'Job',
    },
    [NotificationTypeEnum.Learning]: {
        viewButtonStyles: 'border-rose-400 text-rose-400',
        unclaimedButtonStyles: 'text-white bg-rose-400 border-rose-400',
        claimedButtonStyles: 'text-rose-400 bg-rose-50 border-rose-50',
        textStyles: 'text-rose-400 capitalize',
        iconCircleStyles: 'bg-rose-400',
        IconComponent: Graduation,
        typeText: 'Learning',
    },
};
