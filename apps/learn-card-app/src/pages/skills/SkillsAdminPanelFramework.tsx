import React from 'react';
import { useGetSkillFrameworkById } from 'learn-card-base';

import FrameworkImage from '../SkillFrameworks/FrameworkImage';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import FrameworkSkillsCount from '../SkillFrameworks/FrameworkSkillsCount';

import { SkillFramework } from '../../components/boost/boost';
import type { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';

type SkillsAdminPanelFrameworkProps = {
    framework: SkillFramework | ApiFrameworkInfo;
    buttonClassName?: string;
    onClick?: () => void;
};

const SkillsAdminPanelFramework: React.FC<SkillsAdminPanelFrameworkProps> = ({
    framework,
    buttonClassName,
    onClick,
}) => {
    const { data: frameworkData } = useGetSkillFrameworkById(
        framework.id,
        undefined,
        !framework.image
    );

    const sourceURI =
        'sourceURI' in framework ? framework.sourceURI : frameworkData?.framework?.sourceURI;
    const image = framework.image ?? frameworkData?.framework?.image;

    return (
        <button className={buttonClassName} onClick={onClick}>
            <FrameworkImage image={image} />

            <div className="flex flex-col items-start">
                <span className="font-poppins text-[14px] font-[600] leading-[130%] line-clamp-1 text-grayscale-900">
                    {framework.name}
                </span>

                {/* Not for Scouts */}
                {/* <div className="flex gap-[2px] items-center font-poppins text-[12px] font-[600] line-clamp-1 text-grayscale-700">
                    <ThreeUsersIcon />
                    [Org/Network Name]
                </div> */}

                <FrameworkSkillsCount
                    frameworkId={framework.id}
                    sourceURI={sourceURI}
                    includeSkillWord
                    className="text-[12px] !text-grayscale-700"
                />
            </div>

            <SlimCaretRight className="ml-auto w-[30px] h-[30px] text-grayscale-400" />
        </button>
    );
};

export default SkillsAdminPanelFramework;
