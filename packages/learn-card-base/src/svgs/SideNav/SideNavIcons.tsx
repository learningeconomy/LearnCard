import React from 'react';
import Rocket from 'learn-card-base/svgs/Rocket';
import GlobeStand from 'learn-card-base/svgs/GlobeStand';
import NotificationIcon from 'learn-card-base/svgs/NotificationIcon';
import UnicornIcon from 'learn-card-base/svgs/UnicornIcon';
import ThinnerShieldChevron from 'learn-card-base/svgs/ShieldChevron';

import PassportIcon from 'learn-card-base/svgs/PassportIcon';
import AiSessionsTwoTonedIcon from './AiSessionsTwoTonedIcon';
import AiPathwaysTwoTonedIcon from './AiPathwaysTwoTonedIcon';
import AiInsightsTwoTonedIcon from './AiInsightsTwoTonedIcon';
import SkillsTwoTonedIcon from './SkillsTwoTonedIcon';
import BoostsTwoTonedIcon from './BoostsTwoTonedIcon';
import AchievementsTwoTonedIcon from './AchievementsTwoTonedIcon';
import StudiesTwoTonedIcon from './StudiesTwoTonedIcon';
import IDsTwoTonedIcon from './IDsTwoTonedIcon';
import ExperiencesTwoTonedIcon from './ExperiencesTwoTonedIcon';
import PortfolioTwoTonedIcon from './PortfolioTwoTonedIcon';
import AssistanceTwoTonedIcon from './AssistanceTwoTonedIcon';
import FamiliesTwoTonedIcon from './FamiliesTwoTonedIcon';
import CompassTwoTonedIcon from './CompassTwoTonedIcon';
import DashboardTwoTonedIcon from './DashboardTwoTonedIcon';
import DashboardColorfulIcon from './DashboardColorfulIcon';
import DashboardFormalIcon from './DashboardFormalIcon';

const NotificationIconV2: React.FC<{ className?: string }> = ({ className }) => (
    <NotificationIcon className={className} version="2" />
);

export const SideNavIcons = {
    // primary links
    Rocket,
    GlobeStand,
    NotificationIcon2: NotificationIconV2,
    UnicornIcon,
    ThinnerShieldChevron,

    // secondary links
    PassportIcon,
    AiSessionsTwoTonedIcon,
    AiInsightsTwoTonedIcon,
    AiPathwaysTwoTonedIcon,
    SkillsTwoTonedIcon,
    BoostsTwoTonedIcon,
    AchievementsTwoTonedIcon,
    StudiesTwoTonedIcon,
    IDsTwoTonedIcon,
    ExperiencesTwoTonedIcon,
    PortfolioTwoTonedIcon,
    AssistanceTwoTonedIcon,
    FamiliesTwoTonedIcon,
    CompassTwoTonedIcon,
    DashboardTwoTonedIcon,
    DashboardColorfulIcon,
    DashboardFormalIcon,
};
