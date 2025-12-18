import React from 'react';
import { useHistory } from 'react-router-dom';

import LockSimple from 'learn-card-base/svgs/LockSimple';
import SlimCaretRight from '../../../components/svgs/SlimCaretRight';

import { PathwayItem } from './AiPathwaySessions';

import 'swiper/css';

export const AiPathwaySessionsItem: React.FC<{
    title: string | undefined;
    description: string | undefined;
    skills: Array<{ title: string; description?: string }> | undefined;
    topicUri: string | undefined;
    pathwayUri: string | undefined;
    index: number;
}> = ({ title, description, skills, topicUri, pathwayUri, index }) => {
    const history = useHistory();

    const handleStart = (item: PathwayItem) => {
        if (!item?.topicUri || !item?.pathwayUri) return;

        history.push(
            `/chats?topicUri=${encodeURIComponent(item.topicUri)}&pathwayUri=${encodeURIComponent(
                item.pathwayUri
            )}`
        );
    };

    return (
        <div
            role="button"
            className="flex flex-col items-start justify-between bg-white h-full w-full ion-padding border-solid border-[1px] border-grayscale-100 rounded-[20px] cursor-pointer mb-4 mt-4"
            onClick={() =>
                handleStart({
                    title,
                    description,
                    skills,
                    topicUri,
                    pathwayUri,
                })
            }
        >
            <div>
                <div className="flex items-center justify-between w-full">
                    <h4 className="pr-1 text-grayscale-800 font-semibold text-[17px] text-left line-clamp-1">
                        {title}
                    </h4>

                    <div>
                        <SlimCaretRight className="text-grayscale-800 w-[24px] h-auto" />
                    </div>
                </div>
                <p className="text-grayscale-900 line-clamp-3 text-sm my-4 text-left">
                    {description}
                </p>
            </div>
            <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
                {skills?.map(({ title }, idx) => (
                    <span
                        key={`${title}-${idx}`}
                        className="font-semibold bg-indigo-100 text-indigo-500 rounded-full text-xs px-2 py-1 min-h-[24px] mr-2 inline-block align-top"
                    >
                        <LockSimple version="2" className="h-[16px] w-[16px] inline mr-1" />

                        {title}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default AiPathwaySessionsItem;
