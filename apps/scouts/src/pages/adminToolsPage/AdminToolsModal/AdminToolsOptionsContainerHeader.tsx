import React from 'react';

import WrenchIcon from 'learn-card-base/svgs/WrenchIcon';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import SkillsFrameworkIcon from 'apps/scouts/src/components/svgs/SkillsFrameworkIcon';
import BulkImportWithPlusIcon from 'learn-card-base/svgs/BulkImportWithPlusIcon';

import { AdminToolOption, AdminToolOptionsEnum } from './admin-tools.helpers';

export const AdminToolsOptionsContainerHeader: React.FC<{ option: AdminToolOption }> = ({
    option,
}) => {
    let iconComponent: React.ReactNode = null;

    switch (option.type) {
        case AdminToolOptionsEnum.BULK_UPLOAD:
            iconComponent = <BulkImportWithPlusIcon className="" />;
            break;
        case AdminToolOptionsEnum.IMPORT_SKILL_FRAMEWORKS:
            iconComponent = (
                <div className="bg-indigo-500 rounded-[15px] p-[13px] w-[65px] h-[65px] flex items-center justify-center">
                    <UploadIcon className="w-[40px] h-[40px]" strokeWidth="1.5" />
                </div>
            );
            break;
        case AdminToolOptionsEnum.SKILL_FRAMEWORKS:
            iconComponent = (
                <div className="bg-indigo-500 rounded-[15px] p-[13px] w-[65px] h-[65px] flex items-center justify-center">
                    <SkillsFrameworkIcon className="w-[40px] h-[40px]" />
                </div>
            );
            break;
        default:
            iconComponent = (
                <div className="bg-indigo-500 rounded-[15px] p-2 w-[50px] h-[50px] flex items-center justify-center">
                    <WrenchIcon className="w-[40px] h-[40px]" />
                </div>
            );
            break;
    }

    return (
        <div className="ion-padding p-[20px] bg-white safe-area-top-margin rounded-b-[30px] shadow-bottom-1-5 flex items-center gap-[10px] z-20 relative">
            {iconComponent}
            <div className="flex flex-col items-start justify-center">
                <h5 className="text-[22px] font-[600] text-grayscale-900 font-poppins">
                    {option.title}
                </h5>
            </div>
        </div>
    );
};

export default AdminToolsOptionsContainerHeader;
