import React from 'react';

import X from 'learn-card-base/svgs/X';
import FrameworkImage from '../SkillFrameworks/FrameworkImage';

import { useGetSkillFrameworkById } from 'learn-card-base';
import { SkillsHubFilterOptionsEnum } from './skillshub-search.helpers';

type SkillsHubFilterInfoBubbleProps = {
    filterString: string;
    handleRemove: () => void;
};

const SkillsHubFilterInfoBubble: React.FC<SkillsHubFilterInfoBubbleProps> = ({
    filterString,
    handleRemove,
}) => {
    const isLegacy = filterString === SkillsHubFilterOptionsEnum.legacy;

    const { data: framework } = useGetSkillFrameworkById(filterString, undefined, !isLegacy);

    const name = isLegacy ? 'LearnCard Skills' : framework?.framework?.name;
    const image = isLegacy ? '' : framework?.framework?.image;

    return (
        <div className="flex items-center gap-[5px] bg-grayscale-200 rounded-[10px] p-[5px]">
            <FrameworkImage
                image={image}
                sizeClassName="w-[25px] h-[25px]"
                iconSizeClassName="w-[16px] h-[16px]"
            />
            <span className="text-grayscale-700 font-[600] font-poppins text-[14px]">{name}</span>
            <button onClick={handleRemove} className="text-grayscale-600">
                <X className="h-[16px] w-[16px]" />
            </button>
        </div>
    );
};

export default SkillsHubFilterInfoBubble;
