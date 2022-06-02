import React from 'react';
import FlippyCard from '../FlippyCard/FlippyCard';
import VCDisplayFrontFace from '../VCDisplayFrontFace/VCDisplayFrontFace';
import VCDisplayBackFace from '../VCDisplayBackFace/VCDisplayBackFace';
import { VCDisplayCardProps } from '../../types';
import './VCDisplayCard.css';

export const VCDisplayCard: React.FC<VCDisplayCardProps> = ({
    title,
    createdAt,
    issuer,
    issuee,
    credentialSubject,
    className = '',
    loading,
    verification,
}) => {
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
