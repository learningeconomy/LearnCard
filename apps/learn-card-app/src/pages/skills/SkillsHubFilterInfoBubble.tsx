import React from 'react';

import X from 'learn-card-base/svgs/X';
import FrameworkImage from '../SkillFrameworks/FrameworkImage';

import { useGetSkillFrameworkById } from 'learn-card-base';

type SkillsHubFilterInfoBubbleProps = {
    filterString: string;
    handleRemove: () => void;
};

const SkillsHubFilterInfoBubble: React.FC<SkillsHubFilterInfoBubbleProps> = ({
    filterString,
    handleRemove,
}) => {
    const { data: framework } = useGetSkillFrameworkById(filterString);

    return (
        <div className="flex items-center gap-[5px] bg-grayscale-200 rounded-[10px] p-[5px]">
            <FrameworkImage
                image={framework?.framework?.image}
                sizeClassName="w-[25px] h-[25px]"
                iconSizeClassName="w-[16px] h-[16px]"
            />
            <span className="text-grayscale-700 font-[600] font-poppins text-[14px]">
                {framework?.framework?.name}
            </span>
            <button onClick={handleRemove} className="text-grayscale-600">
                <X className="h-[16px] w-[16px]" />
            </button>
        </div>
    );
};

export default SkillsHubFilterInfoBubble;
