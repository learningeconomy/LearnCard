import React, { useState, useEffect } from 'react';
import VerificationCheckDisplay from '../../assets/images/vc.check.svg';
import CircleSpinner, { CircleLoadingState } from '../Loading/CircleSpinner';

export type VCVerificationCheckProps = {
    size?: string | number;
    loading?: boolean;
};

export const VCVerificationCheck: React.FC<VCVerificationCheckProps> = ({ size = '44px' }) => {
    const imageSize = {
        width: size,
        height: size,
    };
    return (
        <div className="vc-verification-wrapper" style={{ position: 'relative' }}>
            <div className="flex items-center justify-center rounded-[50%] bg-white rounded-full overflow-hidden">
                <img
                    className="h-full w-full object-contain p-1"
                    src={VerificationCheckDisplay ?? ''}
                    style={imageSize}
                    alt="Verification Icon"
                />
            </div>
        </div>
    );
};

export default VCVerificationCheck;

export const VCVerificationCheckWithText: React.FC<VCVerificationCheckProps> = ({
    size = '60px',
    loading = true,
}) => {
    const [defaultLoading, setDefaultLoading] = useState(true);

    const spinnerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '60px', //todo calculate this based on other
        width: '60px',
    };

    useEffect(() => {
        let timer1 = setTimeout(() => setDefaultLoading(false), 3 * 1000);
        return () => {
            clearTimeout(timer1);
        };
    });

    const loadingState =
        loading || defaultLoading ? CircleLoadingState.spin : CircleLoadingState.stop;

    return (
        <div className="flex justify-center items-center translate-x-[10px] w-full vc-verification-full-wrapper">
            <span className="text-white font-bold tracking-wider">Verified</span>
            <div
                style={{ width: size, height: size, position: 'relative' }}
                className={`flex items-center justify-center bg-white rounded-full ml-3 mr-3 overflow-hidden`}
            >
                <VCVerificationCheck size={'44px'} loading={loading} />
                <div className="vc-verification-spinner-overlay" style={spinnerStyle}>
                    <CircleSpinner loadingState={loadingState} />
                </div>
            </div>
            <span className="text-white font-bold tracking-wider">Credential</span>
        </div>
    );
};
