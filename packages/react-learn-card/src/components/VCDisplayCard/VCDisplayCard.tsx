import React, { useState, useEffect } from 'react';
import { walletFromKey } from 'learn-card-core';
import { VC, Issuer, VerificationItem } from 'learn-card-types';
import { format } from 'date-fns';

import FlippyCard from '../FlippyCard/FlippyCard';
import VCDisplayFrontFace from '../VCDisplayFrontFace/VCDisplayFrontFace';
import VCDisplayBackFace from '../VCDisplayBackFace/VCDisplayBackFace';
import { CredentialInfo } from '../../types';
import './VCDisplayCard.css';

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
}) => {
    const [loading, setLoading] = useState(true);
    const [vcVerification, setVCVerification] = useState<VerificationItem[]>([]);

    const {
        title,
        createdAt,
        issuer,
        issuee: _issuee,
        credentialSubject,
    } = getInfoFromCredential(credential);
    const issuee = issueeOverride || _issuee;

    useEffect(() => {
        const verify = async () => {
            const wallet = await walletFromKey('');

            const verification = await wallet.verifyCredential(credential);

            setVCVerification(verification);
            setLoading(false);
        };

        verify();
    }, []);

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
                verification={vcVerification}
            />
        </FlippyCard>
    );
};

export default VCDisplayCard;
