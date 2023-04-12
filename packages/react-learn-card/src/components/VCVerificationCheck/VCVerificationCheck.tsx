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
            <div className="flex items-center justify-center bg-white rounded-full overflow-hidden">
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

export const VCVerificationCheckWithSpinner: React.FC<
    VCVerificationCheckProps & { spinnerSize?: string; withBorder?: boolean }
> = ({ size = '44px', spinnerSize = '60px', loading = true, withBorder = false }) => {
    const loadingState = loading ? CircleLoadingState.spin : CircleLoadingState.stop;

    const spinnerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        height: spinnerSize,
        width: spinnerSize,
    };

    const spinnerSizeNumber = parseInt(spinnerSize.replace('px', ''));
    const offset = spinnerSizeNumber > 50 ? 3 : 2;

    return (
        <div
            style={{ width: spinnerSize, height: spinnerSize, position: 'relative' }}
            className={`flex items-center justify-center bg-white rounded-full overflow-hidden select-none ${withBorder ? ' ml-3 mr-3' : ''
                }`}
        >
            <VCVerificationCheck size={size} loading={loading} />
            <div className="vc-verification-spinner-overlay" style={spinnerStyle}>
                <CircleSpinner
                    loadingState={loadingState}
                    size={spinnerSizeNumber}
                    marginOffset={offset}
                />
            </div>
        </div>
    );
};

export const VCVerificationCheckWithText: React.FC<
    VCVerificationCheckProps & { spinnerSize?: string }
> = ({ size = '44px', spinnerSize = '60px', loading = true }) => {
    const [defaultLoading, setDefaultLoading] = useState(true);

    useEffect(() => {
        let timer1 = setTimeout(() => setDefaultLoading(false), 3 * 1000);
        return () => {
            clearTimeout(timer1);
        };
    });

    return (
        <div className="flex justify-center items-center translate-x-[10px] w-full vc-verification-full-wrapper">
            <span className="text-white font-bold tracking-wider">Verified</span>
            <VCVerificationCheckWithSpinner
                size={size}
                spinnerSize={spinnerSize}
                loading={loading || defaultLoading}
                withBorder
            />
            <span className="text-white font-bold tracking-wider">Credential</span>
        </div>
    );
};
