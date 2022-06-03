import { VerificationItem, VC, Issuer, CredentialSubject } from 'learn-card-types';

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
