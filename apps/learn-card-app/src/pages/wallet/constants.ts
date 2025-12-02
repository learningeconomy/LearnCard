import { Shapes, WalletIcons } from 'learn-card-base';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';

const { Square, Circle, Triangle, Diamond, Kite, Pentagon, Hexagon } = Shapes;
const {
    AiSessionsIcon,
    AiSessionsIconWithShape,
    AiPathwaysIcon,
    AiPathwaysIconWithShape,
    AiInsightsIcon,
    AiInsightsIconWithShape,
    AiInsightsIconWithLightShape,
    SkillsIcon,
    SkillsIconWithShape,
    BoostsIcon,
    BoostsIconWithShape,
    BoostsIconWithLightShape,
    AchievementsIcon,
    AchievementsIconWithShape,
    AchievementsIconWithLightShape,
    StudiesIcon,
    StudiesIconWithShape,
    PortfolioIcon,
    PortfolioIconWithShape,
    PortfolioIconWithLightShape,
    AssistanceIcon,
    AssistanceIconWithShape,
    AssistanceIconWithLightShape,
    ExperiencesIcon,
    ExperiencesIconWithShape,
    ExperiencesIconWithLightShape,
    FamiliesIcon,
    FamiliesIconWithShape,
    FamiliesIconWithLightShape,
    IDsIcon,
    IDsIconWithShape,
    IDsIconWithLightShape,
    SkillsIconWithLightShape,
} = WalletIcons;

export type WalletPageItem = {
    id: number;
    title: string;
    bgColor: string;
    bgColorSecondary: string;
    subtype: WalletCategoryTypes;
    ShapeIcon: React.FC<{ className?: string }>;
    shapeColor: string;
    WalletIcon: React.FC<{ className?: string }>;
    IconWithShape: React.FC<{ className?: string }>;
    IconWithLightShape?: React.FC<{ className?: string }>;
    iconStyles?: string;
    notificationIndicator: {
        borderColor: string;
        backgroundColor: string;
        listItemBackgroundColor?: string;
    };
};

export const walletPageData: WalletPageItem[] = [
    {
        id: 1,
        title: 'AI Sessions',
        bgColor: 'bg-cyan-301',
        bgColorSecondary: 'bg-cyan-501',
        subtype: WalletCategoryTypes.aiSessions,
        ShapeIcon: Circle,
        shapeColor: 'text-cyan-401 w-[80px] h-[80px]',
        iconStyles: 'h-[110px] w-[110px]',
        WalletIcon: AiSessionsIcon,
        IconWithShape: AiSessionsIconWithShape,
        notificationIndicator: {
            borderColor: 'border-cyan-301',
            backgroundColor: 'text-indigo-500',
        },
    },
    {
        id: 2,
        title: 'AI Pathways',
        bgColor: 'bg-teal-300',
        bgColorSecondary: 'bg-teal-500',
        subtype: WalletCategoryTypes.aiPathways,
        ShapeIcon: Triangle,
        shapeColor: 'text-teal-400 w-[100px] h-[100px]',
        WalletIcon: AiPathwaysIcon,
        IconWithShape: AiPathwaysIconWithShape,
        iconStyles: 'h-[100px] w-[100px] !top-[45%]',
        notificationIndicator: {
            borderColor: 'border-teal-300',
            backgroundColor: 'text-indigo-500',
        },
    },
    {
        id: 3,
        title: 'AI Insights',
        bgColor: 'bg-lime-300',
        IconWithShape: AiInsightsIconWithShape,
        IconWithLightShape: AiInsightsIconWithLightShape,
        bgColorSecondary: 'bg-lime-500',
        subtype: WalletCategoryTypes.aiInsights,
        ShapeIcon: Diamond,
        shapeColor: 'text-lime-400 w-[100px] h-[100px]',
        iconStyles: 'h-[100px] w-[100px]',
        WalletIcon: AiInsightsIcon,
        notificationIndicator: {
            borderColor: 'border-lime-300',
            backgroundColor: 'text-indigo-500',
        },
    },
    {
        id: 4,
        title: 'Skills',
        bgColor: 'bg-violet-300', // bg
        bgColorSecondary: 'bg-violet-500', // header bg
        subtype: WalletCategoryTypes.skills,
        ShapeIcon: Square,
        shapeColor: 'text-violet-400 w-[100px] h-[100px]',
        iconStyles: 'h-[110px] w-[110px]',
        WalletIcon: SkillsIcon,
        IconWithShape: SkillsIconWithShape,
        IconWithLightShape: SkillsIconWithLightShape,
        notificationIndicator: {
            borderColor: 'border-violet-300',
            backgroundColor: 'text-lime-200',
        },
    },
    {
        id: 5,
        title: 'Boosts',
        bgColor: 'bg-blue-300',
        bgColorSecondary: 'bg-blue-500',
        subtype: WalletCategoryTypes.socialBadges,
        ShapeIcon: Kite,
        shapeColor: 'text-blue-400 w-[100px] h-[100px]',
        iconStyles: 'h-[90px] w-[90px]',
        WalletIcon: BoostsIcon,
        IconWithShape: BoostsIconWithShape,
        IconWithLightShape: BoostsIconWithLightShape,
        notificationIndicator: {
            borderColor: 'border-blue-300',
            backgroundColor: 'text-cyan-201',
            listItemBackgroundColor: 'text-cyan-101',
        },
    },
    {
        id: 6,
        title: 'Achievements',
        bgColor: 'bg-pink-300',
        bgColorSecondary: 'bg-pink-500',
        subtype: WalletCategoryTypes.achievements,
        ShapeIcon: Pentagon,
        shapeColor: 'text-pink-400',
        iconStyles: 'h-[110px] w-[110px]',
        WalletIcon: AchievementsIcon,
        IconWithShape: AchievementsIconWithShape,
        IconWithLightShape: AchievementsIconWithLightShape,
        notificationIndicator: {
            borderColor: 'border-pink-300',
            backgroundColor: 'text-yellow-200',
        },
    },
    {
        id: 7,
        title: 'Studies',
        bgColor: 'bg-emerald-401',
        bgColorSecondary: 'bg-emerald-601',
        subtype: WalletCategoryTypes.learningHistory,
        ShapeIcon: Hexagon,
        shapeColor: 'text-emerald-501 w-[100px] h-[100px]',
        iconStyles: 'h-[90px] w-[90px]',
        WalletIcon: StudiesIcon,
        IconWithShape: StudiesIconWithShape,
        notificationIndicator: {
            borderColor: 'border-emerald-401',
            backgroundColor: 'text-lime-300',
            listItemBackgroundColor: 'text-lime-200',
        },
    },
    {
        id: 8,
        title: 'Portfolio',
        bgColor: 'bg-yellow-300',
        bgColorSecondary: 'bg-yellow-500',
        subtype: WalletCategoryTypes.accomplishments,
        ShapeIcon: Triangle,
        shapeColor: 'text-yellow-400 rotate-180 w-[100px] h-[100px]',
        iconStyles: 'h-[90px] w-[90px]',
        WalletIcon: PortfolioIcon,
        IconWithShape: PortfolioIconWithShape,
        IconWithLightShape: PortfolioIconWithLightShape,
        notificationIndicator: {
            borderColor: 'border-yellow-300',
            backgroundColor: 'text-emerald-501',
        },
    },
    {
        id: 9,
        title: 'Assistance',
        bgColor: 'bg-violet-300',
        bgColorSecondary: 'bg-violet-500',
        subtype: WalletCategoryTypes.accommodations,
        ShapeIcon: Square,
        shapeColor: 'text-violet-400 w-[110px] h-[110px]',
        iconStyles: 'h-[90px] w-[90px]',
        WalletIcon: AssistanceIcon,
        IconWithShape: AssistanceIconWithShape,
        IconWithLightShape: AssistanceIconWithLightShape,
        notificationIndicator: {
            borderColor: 'border-violet-300',
            backgroundColor: 'text-pink-500',
        },
    },
    {
        id: 10,
        title: 'Experiences',
        bgColor: 'bg-cyan-401',
        bgColorSecondary: 'bg-cyan-601',
        subtype: WalletCategoryTypes.jobHistory,
        ShapeIcon: Circle,
        shapeColor: 'text-cyan-501 w-[90px] h-[90px]',
        WalletIcon: ExperiencesIcon,
        IconWithShape: ExperiencesIconWithShape,
        iconStyles: 'h-[100px] w-[100px] !top-[47%]',
        notificationIndicator: {
            borderColor: 'border-cyan-401',
            backgroundColor: 'text-yellow-200',
        },
    },
    {
        id: 11,
        title: 'Families',
        bgColor: 'bg-amber-400',
        bgColorSecondary: 'bg-amber-600',
        subtype: WalletCategoryTypes.families,
        ShapeIcon: Kite,
        shapeColor: 'text-amber-500',
        WalletIcon: FamiliesIcon,
        IconWithShape: FamiliesIconWithShape,
        notificationIndicator: {
            borderColor: 'border-amber-400',
            backgroundColor: 'text-cyan-501',
        },
    },
    {
        id: 12,
        title: 'IDs',
        bgColor: 'bg-blue-300',
        bgColorSecondary: 'bg-blue-500',
        subtype: WalletCategoryTypes.ids,
        ShapeIcon: Hexagon,
        shapeColor: 'text-blue-400 w-[90px] h-[90px]',
        WalletIcon: IDsIcon,
        IconWithShape: IDsIconWithShape,
        IconWithLightShape: IDsIconWithLightShape,
        notificationIndicator: {
            borderColor: 'border-blue-300',
            backgroundColor: 'text-pink-500',
        },
    },
];
