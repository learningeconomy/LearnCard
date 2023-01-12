import React, { useState } from 'react';
import { AchievementCredential, VC, Profile, VerificationItem } from '@learncard/types';

import FlippyCard from '../FlippyCard/FlippyCard';
import VCDisplayFrontFace from '../VCDisplayFrontFace/VCDisplayFrontFace';
import VCDisplayBackFace from '../VCDisplayBackFace/VCDisplayBackFace';

import { getInfoFromCredential } from '../../helpers/credential.helpers';

const FRONT_FACE = 'front';
const BACK_FACE = 'back';

export type VCDisplayCardPropsReal = {
    credential: VC | AchievementCredential;
    issueeOverride?: Profile;
    issuerOverride?: Profile;
    className?: string;
    hideProfileBubbles?: boolean;
    loading?: boolean;
    verification?: VerificationItem[];
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    overrideDetailsComponent?: React.ReactNode;
    overrideCardTitle?: string;
    overrideCardImageComponent?: React.ReactNode;
    customHeaderComponent?: React.ReactNode;
};

export const VCDisplayCard: React.FC<VCDisplayCardPropsReal> = ({
    credential,
    issueeOverride,
    issuerOverride,
    className = '',
    loading = false,
    verification = [],
    hideProfileBubbles = false,
    subjectImageComponent,
    issuerImageComponent,
    overrideDetailsComponent,
    overrideCardTitle,
    overrideCardImageComponent,
    customHeaderComponent,
}) => {
    const [flipState, setFlipState] = useState(FRONT_FACE);
    const {
        title,
        createdAt,
        issuer: _issuer,
        issuee: _issuee,
        credentialSubject,
    } = getInfoFromCredential(credential);
    const issuee = issueeOverride || _issuee;
    const issuer = issuerOverride || _issuer;

    const handleFlip = () => {
        if (flipState === FRONT_FACE) {
            setFlipState(BACK_FACE);
        }
        if (flipState === BACK_FACE) {
            setFlipState(FRONT_FACE);
        }
    };

    return (
        <FlippyCard flipState={flipState}>
            <VCDisplayFrontFace
                title={title}
                credentialSubject={credentialSubject}
                customHeaderComponent={customHeaderComponent}
                issuer={issuer}
                issuee={issuee}
                subjectImageComponent={subjectImageComponent}
                issuerImageComponent={issuerImageComponent}
                overrideCardImageComponent={overrideCardImageComponent}
                overrideCardTitle={overrideCardTitle}
                hideProfileBubbles={hideProfileBubbles}
                createdAt={createdAt}
                className={className}
                loading={loading}
                handleClick={handleFlip}
            />
            <VCDisplayBackFace
                title={title}
                credentialSubject={credentialSubject}
                overrideDetailsComponent={overrideDetailsComponent}
                issuer={issuer}
                issuee={issuee}
                createdAt={createdAt}
                className={className}
                loading={loading}
                verification={verification}
                handleClick={handleFlip}
            />
        </FlippyCard>
    );
};

export default VCDisplayCard;
