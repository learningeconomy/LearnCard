import React, { useState, useEffect } from 'react';
import { walletFromKey } from '@learncard/core';
import { VC, Profile, VerificationItem } from '@learncard/types';

import { VCDisplayCard } from '../VCDisplayCard';

export type VCCardProps = {
    credential: VC;
    issueeOverride?: Profile;
    className?: string;
};

export const VCCard: React.FC<VCCardProps> = ({ credential, issueeOverride, className = '' }) => {
    const [loading, setLoading] = useState(true);
    const [vcVerification, setVCVerification] = useState<VerificationItem[]>([]);

    useEffect(() => {
        const verify = async () => {
            const wallet = await walletFromKey('a'.repeat(64));
            const verification = await wallet.verifyCredential(credential);
            setVCVerification(verification);
            setLoading(false);
        };

        verify();
    }, []);

    return (
        <VCDisplayCard
            credential={credential}
            issueeOverride={issueeOverride}
            className={className}
            loading={loading}
            verification={vcVerification}
        />
    );
};

export default VCCard;
