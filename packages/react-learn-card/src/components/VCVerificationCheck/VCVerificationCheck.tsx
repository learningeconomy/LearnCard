import React from 'react';
import VerificationCheckDisplay from '../../assets/images/vc.check.svg';

export type VCVerificationCheckProps = {
    size?: string | number;
    loading?: boolean;
};

const VCVerificationCheck: React.FC<VCVerificationCheckProps> = ({
    size = '35px',
    loading = false,
}) => {
    return (
        <div className="vc-verification-wrapper">
            <div className="flex items-center justify-center rounded-[50%] bg-white rounded-full overflow-hidden">
                <img
                    className="h-full w-full object-contain p-1"
                    src={VerificationCheckDisplay ?? ''}
                    alt="Verification Icon"
                />
            </div>
        </div>
    );
};

export default VCVerificationCheck;

export const VCVerificationCheckWithText: React.FC<VCVerificationCheckProps> = ({
    size = '60px',
    loading = false,
}) => {
    return (
        <div className="flex vc-verification-full-wrapper items-center">
            <span className="text-white font-bold tracking-wider">Verified</span>
            <div
                style={{ width: size, height: size }}
                className={`flex items-center justify-center bg-white rounded-full ml-3 mr-3 overflow-hidden`}
            >
                <VCVerificationCheck size={size} loading={loading} />
            </div>
            <span className="text-white font-bold tracking-wider">Credential</span>
        </div>
    );
};
