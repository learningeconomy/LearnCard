import { VerificationItem } from 'learn-card-types';

export type AchievementCriteria = {
    type?: string;
    narrative?: string;
};

export type CredentialSubjectAchievement = {
    type?: string;
    name?: string;
    description?: string;
    criteria?: AchievementCriteria;
    image?: string;
};

export type CredentialSubject = {
    type?: string;
    id?: string;
    achievement: CredentialSubjectAchievement;
};

export type WalletUser = {
    type?: string;
    id?: string;
    name?: string;
    url?: string;
    image?: string;
};

export type Issuer = {
    type?: string;
    id?: string;
    name?: string;
    url?: string;
    image?: string;
};

export type VCDisplayCardProps = {
    title?: string;
    createdAt?: string;
    issuer?: Issuer;
    issuee?: WalletUser;
    userImage?: string;
    className?: string;
    credentialSubject?: CredentialSubject;
    onClick?: () => void;
    loading?: boolean;
    verification?: VerificationItem[];
};
