import React, { useState, useEffect } from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { ModalTypes, VideoMetadata, getVideoMetadata, useModal } from 'learn-card-base';
import { useCareerOneStopVideo } from 'learn-card-base/react-query/queries/careerOneStop';
import AiPathwayContentPreview from './ai-pathway-explore-content/AiPathwayContentPreview';
import careerOneStopLogo from '../../assets/images/career-one-stop-logo.png';
import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';

type GrowSkillsAiSessionData = {
    title: string | undefined;
    description: string | undefined;
    skills: Array<{ title: string; description?: string }> | undefined;
    topicUri: string | undefined;
    pathwayUri: string | undefined;
};

type GrowSkillsAiSessionItemProps = {
    data: GrowSkillsAiSessionData;
};

const GrowSkillsAiSessionItem: React.FC<GrowSkillsAiSessionItemProps> = ({ data }) => {
    const { newModal } = useModal({ mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel });

    const { title, description, skills, topicUri, pathwayUri } = data;

    return (
        <div
            role="button"
            // onPointerDown={handlePointerDown}
            // onPointerMove={handlePointerMove}
            // onPointerUp={handlePointerUp}
            // onPointerCancel={handlePointerUp}
            // onClickCapture={handleClickCapture}
            // onClick={openCourseDetailsModal}
            className="w-full h-full flex flex-col rounded-[15px] bg-white shadow-bottom-4-4 overflow-hidden cursor-pointer border-b-[3px] border-cyan-400 text-left"
        >
            <div className="px-[15px] py-[20px] flex flex-col gap-[5px]">
                <div className="flex items-start gap-[10px]">
                    <AiSessionsIconWithShape className="w-[35px] h-[35px] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[17px] font-poppins font-[600] text-grayscale-900 leading-[24px] tracking-[0.25px] line-clamp-2 text-left">
                            {title}
                        </h3>
                    </div>
                    <ChevronRight className="w-[20px] h-[20px] text-grayscale-700 flex-shrink-0" />
                </div>

                <p className="text-[14px] text-grayscale-600 font-notoSans text-left">
                    {description}
                </p>

                <div className="pt-[10px]">
                    <p className="text-[13px] text-grayscale-500 italic text-left">Skills TODO</p>
                </div>
            </div>
        </div>
    );
};

export default GrowSkillsAiSessionItem;
