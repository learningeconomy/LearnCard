import { VerificationItem, VC, Profile, CredentialSubject } from '@learncard/types';

export enum Icons {
    sheckelsIcon,
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
