import React from 'react';

import WarningIcon from '../../../components/svgs/WarningIcon';

import { useTheme } from '../../../theme/hooks/useTheme';

export const AdminToolsConsentFlowServiceProfileWarning: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    return (
        <div className="flex flex-col items-start justify-center w-full px-4">
            <div
                className={`flex gap-[5px] rounded-[10px] bg-${primaryColor} bg-opacity-[10%] justify-center ion-padding mt-4`}
            >
                <div className="w-full flex flex-col">
                    <p
                        className={`flex items-center justify-start text-[18px] text-${primaryColor} font-poppins font-[600]`}
                    >
                        <WarningIcon className="inline mr-2 h-[20px] w-[20px]" /> Organization
                        Profile Required
                    </p>
                    <p className={`text-xs text-${primaryColor} font-poppins mt-2`}>
                        To create a contract, you must be logged in as an Organization Profile. If
                        you don’t have one yet, please create an Organization Profile first.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminToolsConsentFlowServiceProfileWarning;
