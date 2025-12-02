import React from 'react';
import JsonDocIcon from 'learn-card-base/svgs/JsonDocIcon';
import CheckCircle from 'learn-card-base/svgs/CheckCircle';
import RedXCircle from 'learn-card-base/svgs/RedXCircle';

type ManageSkillsFileInfoDisplayProps = {
    fileInfo: { type?: string; size?: string; name: string } | null;
    icon?: 'none' | 'check' | 'error';
};

const ManageSkillsFileInfoDisplay: React.FC<ManageSkillsFileInfoDisplayProps> = ({
    fileInfo,
    icon = 'none',
}) => {
    if (!fileInfo) return undefined;

    return (
        <div className="flex items-center justify-between w-full relative overflow-hidden">
            <div className="flex flex-1 items-center justify-start gap-[10px]">
                <JsonDocIcon
                    className="h-[50px] min-h-[50px] min-w-[50px] w-[50px]"
                    color={icon === 'error' ? 'gray' : 'green'}
                />
                <div className="flex items-start justify-center text-left flex-col pr-4">
                    <p className="text-grayscale-900 text-[14px] font-[600] text-left font-notoSans line-clamp-2">
                        {fileInfo.name}
                    </p>
                    {fileInfo.type && fileInfo.size && (
                        <p className="w-full text-[12px] text-grayscale-70 font-notoSans">
                            {fileInfo.type} • {fileInfo.size}
                        </p>
                    )}
                </div>
            </div>

            {icon === 'check' && (
                <CheckCircle
                    className="text-emerald-700 h-[25px] w-[25px] shrink-0"
                    color="currentColor"
                />
            )}
            {icon === 'error' && (
                <RedXCircle className="h-[30px] w-[30px] shrink-0" version="outlined" />
            )}
        </div>
    );
};

export default ManageSkillsFileInfoDisplay;
