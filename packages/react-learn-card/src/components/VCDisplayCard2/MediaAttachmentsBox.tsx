import React from 'react';
import { MediaAttachment } from '../../helpers/test.helpers';

import Camera from '../svgs/Camera';
import GenericDocumentIcon from '../svgs/GenericDocumentIcon';

type MediaAttachmentsBoxProps = {
    attachments: MediaAttachment[];
};

const MediaAttachmentsBox: React.FC<MediaAttachmentsBoxProps> = ({ attachments }) => {
    const images = attachments.filter(a => a.type === 'image');
    const files = attachments.filter(a => a.type === 'txt' || a.type === 'pdf');

    const getIconForFile = (fileType: string) => {
        return <GenericDocumentIcon />;
    };

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">Media Attachments</h3>
            {images.length > 0 && (
                <div className="flex gap-[5px] justify-between flex-wrap w-full">
                    {images.map(image => (
                        <div className="w-[49%] pt-[49%] rounded-[15px] overflow-hidden relative">
                            <img
                                className="absolute top-0 left-0 right-0 bottom-0"
                                src={image.url}
                            />
                            <Camera className="absolute bottom-[10px] left-[10px] z-10" />
                        </div>
                    ))}
                </div>
            )}
            {files.length > 0 && (
                <div className="w-full flex flex-col gap-[5px]">
                    {files.map(f => (
                        <div className="bg-grayscale-100 rounded-[15px] p-[10px] w-full font-poppins text-[12px] leading-[18px] tracking-[-0.33px]">
                            <div className="flex gap-[5px] items-center">
                                {getIconForFile(f.type)}
                                <span className="text-grayscale-900 font-[400]">
                                    {f.name ?? 'No title'}
                                </span>
                            </div>
                            <div className="text-grayscale-600 font-[600] px-[5px]">
                                <span className="uppercase">{f.type}</span> • ? page(s) • ??? kB
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaAttachmentsBox;
