import React, { useState, useEffect } from 'react';
import { initLearnCard } from '@learncard/init';
import type { VC, Profile, VerificationItem } from '@learncard/types';

import { VCDisplayCard } from '../VCDisplayCard';
import {
    VCDisplayCard2,
    type CredentialIconType,
} from '../VCDisplayCard2';

import type { MediaMetadata, VideoMetadata } from '../../types';

export type VCCardProps = {
    credential: VC;
    issueeOverride?: Profile;
    className?: string;
    version?: '1' | '2';

    /* Only used for version 2 */
    subjectImageComponent?: React.ReactNode;
    // convertTagsToSkills?: (tags: string[]) => { [skill: string]: string[] };
    handleXClick?: () => void;
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string) => void;
    bottomRightIcon?: CredentialIconType;
};

export const VCCard: React.FC<VCCardProps> = ({
    credential,
    issueeOverride,
    className = '',
    version = '1',
    subjectImageComponent,
    // convertTagsToSkills,
    handleXClick,
    getFileMetadata,
    getVideoMetadata,
    onMediaAttachmentClick,
    bottomRightIcon,
}) => {
    const [loading, setLoading] = useState(true);
    const [vcVerification, setVCVerification] = useState<VerificationItem[]>([]);

    useEffect(() => {
        const verify = async () => {
            const wallet = await initLearnCard();
            const verification = await wallet.invoke.verifyCredential(credential, {}, true);
            setVCVerification(verification);
            setLoading(false);
        };

        verify();
    }, [credential]);

    if (version === '1') {
        return (
            <VCDisplayCard
                credential={credential}
                issueeOverride={issueeOverride}
                className={className}
                loading={loading}
                verification={vcVerification}
            />
        );
    }
    return (
        <VCDisplayCard2
            credential={credential}
            issueeOverride={issueeOverride}
            verificationInProgress={loading}
            verificationItems={vcVerification}
            subjectImageComponent={subjectImageComponent}
            // convertTagsToSkills={convertTagsToSkills}
            handleXClick={handleXClick}
            getFileMetadata={getFileMetadata}
            getVideoMetadata={getVideoMetadata}
            onMediaAttachmentClick={onMediaAttachmentClick}
            bottomRightIcon={bottomRightIcon}
        />
    );
};

export default VCCard;
