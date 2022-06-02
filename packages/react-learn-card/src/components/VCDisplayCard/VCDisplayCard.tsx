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
            />
            <VCDisplayBackFace
                title={title}
                credentialSubject={credentialSubject}
                issuer={issuer}
                issuee={issuee}
                createdAt={createdAt}
                className={className}
            />
        </FlippyCard>
    );
};

export default VCDisplayCard;
