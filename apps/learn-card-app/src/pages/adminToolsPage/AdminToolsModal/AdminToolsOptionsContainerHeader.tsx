import React from 'react';

import WrenchIcon from 'learn-card-base/svgs/WrenchIcon';
import BulkImportWithPlusIcon from 'learn-card-base/svgs/BulkImportWithPlusIcon';

import { AdminToolOption, AdminToolOptionsEnum } from './admin-tools.helpers';

import { useTheme } from '../../../theme/hooks/useTheme';

export const AdminToolsOptionsContainerHeader: React.FC<{ option: AdminToolOption }> = ({
    option,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    let iconComponent: React.ReactNode = null;

    switch (option.type) {
        case AdminToolOptionsEnum.BULK_UPLOAD:
            iconComponent = <BulkImportWithPlusIcon className="mr-2" />;
            break;
        default:
            iconComponent = (
                <div
                    className={`bg-${primaryColor} rounded-[15px] p-2 w-[50px] h-[50px] flex items-center justify-center mr-2`}
                >
                    <WrenchIcon />
                </div>
            );
            break;
    }

    return (
        <div className="ion-padding bg-white safe-area-top-margin rounded-b-[30px] overflow-hidden shadow-md">
            <div className="flex items-center justify-normal p-2">
                <div className="flex items-center">
                    {iconComponent}
                    <div className="flex flex-col items-start justify-center">
                        <h5 className="text-[22px] font-semibold text-grayscale-800 font-notoSans">
                            {option.title}
                        </h5>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminToolsOptionsContainerHeader;
