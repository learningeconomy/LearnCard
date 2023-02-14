import {
    VerificationItem,
    AchievementCredential,
    Profile,
    CredentialSubject,
} from '@learncard/types';
import React from 'react';

export enum Icons {
    coinsIcon,
    userIcon,
    trophyIcon,
    briefcaseIcon,
    graduationIcon,
    lightbulbIcon,
    gradcaplight,
    trophylight,
    puzzlelight,
    award,
}

export enum LCSubtypes {
    job = 'job',
    achievement = 'achievement',
    skill = 'skill',
    course = 'course',
    locked = 'locked',
}

export enum WalletCategoryTypes {
    achievements = 'achievements',
    ids = 'ids',
    jobHistory = 'jobHistory',
    currency = 'currency',
    learningHistory = 'learningHistory',
    skills = 'skills',
    socialBadge = 'socialBadge',
}

export type CredentialInfo = {
    title?: string;
    imageUrl?: string;
    createdAt?: string;
    issuer?: Profile;
    issuee?: Profile;
    credentialSubject?: CredentialSubject;
};

export type VCDisplayCardProps = {
    title?: string;
    createdAt?: string;
    issuer?: Profile;
    issuee?: Profile;
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    hideProfileBubbles?: boolean;
    userImage?: string;
    className?: string;
    credentialSubject?: CredentialSubject;
    onClick?: () => void;
    loading?: boolean;
    verification?: VerificationItem[];
    handleClick?: () => void;
    overrideDetailsComponent?: React.ReactNode;
    overrideCardTitle?: string;
    overrideCardImageComponent?: React.ReactNode;
    customHeaderComponent?: React.ReactNode;
};

export type RoundedSquareProps = {
    title?: string;
    description?: string;
    iconSrc?: string;
    count?: string | number;
    onClick?: () => void;
    bgColor?: string;
};

export type SmallAchievementCardProps = {
    title?: string;
    thumbImgSrc?: string;
    showStatus?: boolean;
    showSkills?: boolean;
    date?: string;
    onClick?: () => void;
};

export type AchievementCardProps = {
    title?: string;
    thumbImgSrc?: string;
    showStatus?: boolean;
    claimStatus?: boolean;
    showSkills?: boolean;
    skillCount?: number;
    showChecked?: boolean;
    checked?: boolean;
    onCheckClick?: () => void;
    onClick?: () => void;
};

export type CourseCardProps = {
    status?: string;
    title?: string;
    semester?: string;
    skillCount?: string | number;
    thumbSrc?: string;
    jobCount?: string | number;
    className?: string;
    hideHeader?: boolean;
    check?: boolean;
    achievementCount: string | number;
    onClick?: () => void;
};

export type CourseCardVerticalProps = {
    title?: string;
    className?: string;
    thumbImgSrc?: string;
    showStatus?: boolean;
    claimStatus?: boolean;
    achievementCount?: number;
    skillCount?: number;
    date?: string;
    checked?: boolean;
    showChecked?: boolean;
    showSubCount?: boolean;
    onCheckClick?: () => void;
    onClick?: () => void;
};

export type SkillsCardProps = {
    count?: number;
    title?: string;
    level?: string;
    category?: string;
    levelCount?: number;
    skillColor?: string;
    onClick?: () => void;
    className?: string;
};

export type SkillStat = {
    name?: string;
    percent: number | string;
    className?: string;
};

export type SkillsStatsCardProps = {
    totalCount?: string | number;
    skills?: SkillStat[];
    className?: string;
    onClick?: () => void;
};

export type SkillVerticalCardProps = {
    title: string;
    completed?: number;
    total?: number;
    thumbImg?: string;
    onClick?: () => void;
    className?: string;
};

export type RoundedPillProps = {
    statusText?: string;
    type?: LCSubtypes.course | LCSubtypes.achievement | LCSubtypes.skill | 'locked';
    onClick?: () => void;
    showCheckmark?: boolean;
};

export type JobQualificationsCount = {
    fulfilledCount: number;
    totalRequiredCount: number;
};

export type JobQualificationDisplay = {
    skills?: JobQualificationsCount;
    achievements?: JobQualificationsCount;
    courses?: JobQualificationsCount;
};

export type JobListCardProps = {
    title?: string;
    customButtonComponent?: React.ReactNode;
    company?: string;
    compensation?: string;
    location?: string;
    locationRequirement?: string;
    timeRequirement?: string;
    qualificationDisplay?: JobQualificationDisplay;
    percentQualifiedDisplay?: string;
    postDateDisplay?: string;
    imgThumb?: string;
    isBookmarked?: boolean;
    className?: string;
    onBookmark?: () => void;
    onClick?: () => void;
};

export type LearnPillProps = {
    count: number | string;
    type: LCSubtypes.course | LCSubtypes.achievement | LCSubtypes.skill;
    className?: string;
};

export type CircleCheckButtonProps = {
    onClick?: () => void;
    className?: string;
    bgColor?: string;
    checked?: boolean;
};

export type SkillTabCardProps = {
    title?: string;
    description?: string;
    checked?: boolean;
    showChecked?: boolean;
    showStatus?: boolean;
    className?: string;
    onCheckClicked?: () => void;
    onClick?: () => void;
};

export type JobHistoryCardProps = {
    title?: string;
    company?: string;
    description?: string;
    dateRange?: string;
    jobType?: string;
    className?: string;
    showArrow?: boolean;
    onClick?: () => void;
};

export type GenericCardProps = {
    title?: string;
    className?: string;
    type?: WalletCategoryTypes;
    thumbImgSrc?: string;
    customThumbClass?: string;
    customHeaderClass?: string;
    showChecked?: boolean;
    checkStatus?: boolean;
    onClick?: () => void;
    flipped?: boolean;
};

export type Attachment = { title: string; url: string; type: string };

export type BoostAchievementCredential = AchievementCredential & {
    display?: { backgroundImage?: string; backgroundColor?: string };
    image: string;
    attachments: Attachment[];
};
