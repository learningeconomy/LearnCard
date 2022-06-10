import { VerificationItem, VC, Issuer, CredentialSubject } from '@learncard/types';

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
    issuer?: Issuer;
    issuee?: Issuer;
    credentialSubject?: CredentialSubject;
};

export type VCDisplayCardProps = {
    title?: string;
    createdAt?: string;
    issuer?: Issuer;
    issuee?: Issuer;
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
    iconSrc?: Icons | string;
    count?: string | number;
    onClick?: () => void;
    bgColor?: string;
};
