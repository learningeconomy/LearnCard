import React, { useState } from 'react';
import { AchievementCredential, VC, Profile, VerificationItem } from '@learncard/types';
import { format } from 'date-fns';

import FlippyCard from '../FlippyCard/FlippyCard';
import VCDisplayFrontFace from '../VCDisplayFrontFace/VCDisplayFrontFace';
import VCDisplayBackFace from '../VCDisplayBackFace/VCDisplayBackFace';
import { CredentialInfo } from '../../types';

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
};

const getInfoFromCredential = (credential: VC | AchievementCredential): CredentialInfo => {
    const { issuer, issuanceDate } = credential;

    const credentialSubject = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject[0]
        : credential.credentialSubject;

    const title = credentialSubject.achievement?.name;
    const createdAt = format(new Date(issuanceDate), 'dd MMM yyyy').toUpperCase();
    const issuee = credentialSubject.id;

    return { title, createdAt, issuer, issuee, credentialSubject };
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
}) => {
    const [flipState, setFlipState] = useState(FRONT_FACE);
    console.log('//VCDISPLAY CARD RENDER')

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
        console.log('//HANDLE FLIPFLIPSTATE', flipState)
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
                issuer={issuer}
                issuee={issuee}
                subjectImageComponent={subjectImageComponent}
                issuerImageComponent={issuerImageComponent}
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
