import React from 'react';
import { VC, Issuer, VerificationItem } from 'learn-card-types';
import { format } from 'date-fns';

import FlippyCard from '../FlippyCard/FlippyCard';
import VCDisplayFrontFace from '../VCDisplayFrontFace/VCDisplayFrontFace';
import VCDisplayBackFace from '../VCDisplayBackFace/VCDisplayBackFace';
import { CredentialInfo } from '../../types';

export type VCDisplayCardPropsReal = {
    credential: VC;
    issueeOverride?: Issuer;
    className?: string;
    loading?: boolean;
    verification?: VerificationItem[];
};

const getInfoFromCredential = (credential: VC): CredentialInfo => {
    const { issuer, credentialSubject, issuanceDate } = credential;

    const title = credential.credentialSubject.achievement?.name;
    const createdAt = format(new Date(issuanceDate), 'dd MMM yyyy').toUpperCase();
    const issuee = credential.credentialSubject.id;

    return { title, createdAt, issuer, issuee, credentialSubject };
};

export const VCDisplayCard: React.FC<VCDisplayCardPropsReal> = ({
    credential,
    issueeOverride,
    className = '',
    loading = false,
    verification = [],
}) => {
    const {
        title,
        createdAt,
        issuer,
        issuee: _issuee,
        credentialSubject,
    } = getInfoFromCredential(credential);
    const issuee = issueeOverride || _issuee;

    return (
        <FlippyCard>
            <VCDisplayFrontFace
                title={title}
                credentialSubject={credentialSubject}
                issuer={issuer}
                issuee={issuee}
                createdAt={createdAt}
                className={className}
                loading={loading}
            />
            <VCDisplayBackFace
                title={title}
                credentialSubject={credentialSubject}
                issuer={issuer}
                issuee={issuee}
                createdAt={createdAt}
                className={className}
                loading={loading}
                verification={verification}
            />
        </FlippyCard>
    );
};

export default VCDisplayCard;
