import React, { useEffect, useState } from 'react';

import Video from 'learn-card-base/svgs/Video';
import AiPathwayContentPreview from './AiPathwayContentPreview';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';

import {
    useModal,
    ModalTypes,
    VideoMetadata,
    getVideoSource,
    getVideoMetadata,
} from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

import { AiPathwayContent } from './ai-pathway-content.helpers';

const AiPathwayContentListItem: React.FC<{
    content: AiPathwayContent;
}> = ({ content }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const { newModal } = useModal({ mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel });

    const [metaData, setMetaData] = useState<VideoMetadata | null>(null);

    const handleGetVideoMetadata = async () => {
        const metadata = await getVideoMetadata(content.url || '');
        setMetaData(metadata);
    };

    const handleViewCourse = () => {
        newModal(<AiPathwayContentPreview content={content} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    useEffect(() => {
        handleGetVideoMetadata();
    }, [content]);

    const mediaHeight = 'min-h-[80px] max-h-[80px]';

    return (
        <div
            role="button"
            onClick={handleViewCourse}
            className={`flex bg-grayscale-100 rounded-[20px] relative ${mediaHeight} w-full`}
        >
            <>
                <div className="w-[80px] relative overflow-hidden rounded-[20px] shadow-3xl min-h-[80px] max-h-[80px] flex-shrink-0">
                    <div className="block h-full">
                        <img
                            src={metaData?.thumbnailUrl || EmptyImage}
                            alt={content.title || 'Video Cover'}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent"></div>
                        <Video className="absolute left-2 bottom-2 h-[20px] w-[20px] text-white" />
                    </div>
                </div>

                <div
                    className="flex flex-1 py-4 pl-4 rounded-r-[20px] flex-col justify-between z-10 mr-[30px]"
                    style={{ textDecoration: 'none' }}
                >
                    <p className="pr-2 text-sm text-left text-grayscale-900 break-all line-clamp-1">
                        {content.title}
                    </p>
                    <p className="text-xs text-gray-400 self-start break-all">
                        {getVideoSource(content.url || '')}
                    </p>
                </div>
            </>
        </div>
    );
};

export default AiPathwayContentListItem;
