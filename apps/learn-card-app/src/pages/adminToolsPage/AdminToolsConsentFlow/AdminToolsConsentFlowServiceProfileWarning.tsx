import { tailwindColorWithOpacity } from 'learn-card-base/helpers/colorHelpers';
import React from 'react';

import WarningIcon from '../../../components/svgs/WarningIcon';

import { useTheme } from '../../../theme/hooks/useTheme';
import * as m from '../../../paraglide/messages.js';

export const AdminToolsConsentFlowServiceProfileWarning: React.FC = () => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    return (
        <div className="flex flex-col items-start justify-center w-full px-4">
            <div
                style={{ backgroundColor: tailwindColorWithOpacity(primaryColor, 10) }}
                className="flex gap-[5px] rounded-[10px] justify-center ion-padding mt-4"
            >
                <div className="w-full flex flex-col">
                    <p
                        className={`flex items-center justify-start text-[18px] text-${primaryColor} font-poppins font-[600]`}
                    >
                        <WarningIcon className="inline mr-2 h-[20px] w-[20px] shrink-0" />{' '}
                        {m['adminTools.consentFlow.warning.title']()}
                    </p>
                    <p className={`text-xs text-${primaryColor} font-poppins mt-2`}>
                        {m['adminTools.consentFlow.warning.description']()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminToolsConsentFlowServiceProfileWarning;
