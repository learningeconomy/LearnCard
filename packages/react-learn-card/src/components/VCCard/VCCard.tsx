import React, { useState, useEffect } from 'react';
import { initLearnCard } from '@learncard/core';
import { VC, Profile, VerificationItem } from '@learncard/types';

import { VCDisplayCard } from '../VCDisplayCard';
import { VCDisplayCard2 } from '../VCDisplayCard2';

export type VCCardProps = {
    credential: VC;
    issueeOverride?: Profile;
    className?: string;
    version?: '1' | '2';
};

export const VCCard: React.FC<VCCardProps> = ({
    credential,
    issueeOverride,
    className = '',
    version = '1',
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
        />
    );
};

export default VCCard;
