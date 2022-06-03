import React, { useState, useEffect } from 'react';
import { walletFromKey } from 'learn-card-core';
import { VC, Issuer, VerificationItem } from 'learn-card-types';

import { VCDisplayCard } from '../VCDisplayCard';

export type VCCardProps = {
    credential: VC;
    issueeOverride?: Issuer;
    className?: string;
};

export const VCCard: React.FC<VCCardProps> = ({ credential, issueeOverride, className = '' }) => {
    const [loading, setLoading] = useState(true);
    const [vcVerification, setVCVerification] = useState<VerificationItem[]>([]);

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
        <VCDisplayCard
            credential={credential}
            issueeOverride={issueeOverride}
            className={className}
            loading={loading}
            verification={vcVerification}
        />
    );
};

export default VCDisplayCard;
