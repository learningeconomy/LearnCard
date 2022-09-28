import { VerificationItem, VC, Profile, CredentialSubject } from '@learncard/types';

export enum Icons {
    coinsIcon,
    userIcon,
    trophyIcon,
    briefcaseIcon,
    graduationIcon,
    lightbulbIcon,
}

export type CredentialInfo = {
    title?: string;
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
    userImage?: string;
    className?: string;
    credentialSubject?: CredentialSubject;
    onClick?: () => void;
    loading?: boolean;
    verification?: VerificationItem[];
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
    date?: string;
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
    achievementCount: string | number;
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

export type JobQualificationsCount = {
    fulfilledCount: number;
    totalRequiredCount: number;
};

export type JobQualificationDisplay = {
    skills?: JobQualificationsCount;
    achievements?: JobQualificationsCount;
    courses?: JobQualificationsCount;
};

export type JobListCard = {
    title?: string;
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
};
