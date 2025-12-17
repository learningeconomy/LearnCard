import React from 'react';

import { AdminToolOption } from '../admin-tools.helpers';

import { useTheme } from '../../../../theme/hooks/useTheme';

export const AdminToolsOptionItemHeader: React.FC<{
    option?: AdminToolOption;
    onClick?: () => void;
    isDisabled?: boolean;
    className?: string;
}> = ({ option, onClick, className = '', isDisabled = false }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    return (
        <div className={`flex flex-col items-start justify-center w-full ion-padding ${className}`}>
            <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                {option?.title}
            </h4>
            <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
                {option?.description}
            </p>

            {option?.actionLabel && onClick && (
                <button
                    onClick={onClick}
                    disabled={isDisabled}
                    className={`w-full flex rounded-[30px] items-center justify-center  py-2 font-semibold text-[17px] bg-${primaryColor} text-white ${
                        isDisabled ? 'opacity-50' : ''
                    }`}
                >
                    {option.actionLabel}
                </button>
            )}
        </div>
    );
};

export default AdminToolsOptionItemHeader;
