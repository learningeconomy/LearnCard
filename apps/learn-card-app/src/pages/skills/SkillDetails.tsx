import React, { useState } from 'react';

import { ModalTypes, useGetSkillFrameworkById, useModal } from 'learn-card-base';

import FrameworkImage from '../SkillFrameworks/FrameworkImage';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import SkillBreadcrumbText from '../SkillFrameworks/SkillBreadcrumbText';
import BrowseFrameworkPage from '../SkillFrameworks/BrowseFrameworkPage';
import FrameworkSkillsCount from '../SkillFrameworks/FrameworkSkillsCount';
import SkillIssuances from './SkillIssuances';

import { VC } from '@learncard/types';

type SkillDetailsProps = {
    frameworkId: string;
    skillId: string;
    credentials: VC[];
};

const SkillDetails: React.FC<SkillDetailsProps> = ({ frameworkId, skillId, credentials }) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const { data: frameworkData } = useGetSkillFrameworkById(frameworkId);

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const openBrowseFrameworkModal = () => {
        newModal(
            <BrowseFrameworkPage
                frameworkInfo={frameworkData?.framework ?? {}}
                handleClose={closeModal}
                isViewOnly
            />
        );
    };

    return (
        <section className="flex flex-col gap-[10px] h-full w-full max-w-[600px] pt-[40px]">
            <SkillIssuances frameworkId={frameworkId} skillId={skillId} credentials={credentials} />

            {frameworkData && (
                <div className="flex flex-col gap-[20px] p-[15px] bg-white rounded-[15px] shadow-bottom-2-4">
                    <p className="font-poppins text-[17px] text-grayscale-900">Framework</p>

                    <div className="flex items-center gap-[10px]">
                        <FrameworkImage
                            image={frameworkData?.framework.image}
                            sizeClassName="w-[65px] h-[65px]"
                            iconSizeClassName="w-[36px] h-[36px]"
                        />
                        <h5 className="text-[16px] text-grayscale-900 font-poppins line-clamp-2">
                            {frameworkData?.framework.name}
                        </h5>
                    </div>

                    {frameworkData?.framework.description && (
                        <p className="text-grayscale-700 font-poppins text-[14px]">
                            {frameworkData?.framework.description.length > 333
                                ? isDescriptionExpanded
                                    ? frameworkData?.framework.description
                                    : `${frameworkData?.framework.description.slice(0, 330)}...`
                                : frameworkData?.framework.description}
                            {frameworkData?.framework.description.length > 333 && (
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="text-grayscale-700 font-poppins text-[14px] font-[600] ml-1"
                                >
                                    {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                                </button>
                            )}
                        </p>
                    )}

                    <div className="flex flex-col gap-[5px]">
                        <span className="uppercase font-poppins text-[14px] text-grayscale-700">
                            Location in Framework
                        </span>

                        <SkillBreadcrumbText
                            frameworkId={frameworkId}
                            skillId={skillId}
                            includeSkill
                        />
                    </div>

                    <div className="pt-[20px] pb-[10px] border-t-[1px] border-grayscale-200 border-solid">
                        <button
                            onClick={openBrowseFrameworkModal}
                            className="text-grayscale-900 font-poppins text-[17px] leading-[130%] flex items-center gap-[5px] w-full"
                        >
                            Browse
                            <div className="flex items-center ml-auto text-[14px]">
                                <FrameworkSkillsCount
                                    frameworkId={frameworkId}
                                    className="!text-grayscale-700"
                                    includeSkillWord
                                />
                                <SlimCaretRight className="text-grayscale-700" />
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SkillDetails;
