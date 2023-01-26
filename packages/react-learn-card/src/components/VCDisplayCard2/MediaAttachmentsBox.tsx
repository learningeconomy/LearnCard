import React, { useState, useEffect } from 'react';
import { MediaAttachment } from '../../helpers/test.helpers';
import prettyBytes from 'pretty-bytes';

import Camera from '../svgs/Camera';
import GenericDocumentIcon from '../svgs/GenericDocumentIcon';

export type MediaMetadata = {
    fileExtension?: string;
    sizeInBytes?: number;
    numberOfPages?: number;
};

type MediaAttachmentsBoxProps = {
    attachments: MediaAttachment[];
    getFileMetadata?: (url: string) => MediaMetadata;
};

const defaultGetFileMetadata = async (url: string) => {
    const urlParams = url.split('.com/')[1].split('/');
    const handle = urlParams[urlParams.length - 1];

    const data = await fetch(`https://cdn.filestackcontent.com/${handle}/metadata`).then(res =>
        res.json()
    );

    const fileExtension = data.filename.split('.')[1];

    return {
        fileExtension,
        sizeInBytes: data.size,
        numberOfPages: undefined,
    };
};

const MediaAttachmentsBox: React.FC<MediaAttachmentsBoxProps> = ({
    attachments,
    getFileMetadata = defaultGetFileMetadata,
}) => {
    const [fileMetadata, setFileMetadata] = useState<{ [fileUrl: string]: MediaMetadata }>({});

    const images = attachments.filter(a => a.type === 'image');
    const files = attachments.filter(a => a.type === 'txt' || a.type === 'pdf');

    useEffect(() => {
        const getMetadata = async (urls: string[]): Promise<any> => {
            const metadata: { [fileUrl: string]: MediaMetadata } = {};
            await Promise.all(
                urls.map(async url => {
                    metadata[url] = await getFileMetadata(url);
                })
            );

            setFileMetadata(metadata);
        };

        getMetadata(files.map(f => f.url));
    }, []);

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">Media Attachments</h3>
            {images.length > 0 && (
                <div className="flex gap-[5px] justify-between flex-wrap w-full">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="w-[49%] pt-[49%] rounded-[15px] overflow-hidden relative"
                        >
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
                    {files.map((f, index) => {
                        const metadata = fileMetadata[f.url];
                        const { fileExtension, sizeInBytes, numberOfPages } = metadata ?? {};
                        return (
                            <div
                                key={index}
                                className="bg-grayscale-100 rounded-[15px] p-[10px] w-full font-poppins text-[12px] leading-[18px] tracking-[-0.33px]"
                            >
                                <div className="flex gap-[5px] items-center">
                                    <GenericDocumentIcon className="shrink-0" />
                                    <span className="text-grayscale-900 font-[400]">
                                        {f.name ?? 'No title'}
                                    </span>
                                </div>
                                {metadata && (
                                    <div className="text-grayscale-600 font-[600] px-[5px]">
                                        {fileExtension && (
                                            <span className="uppercase">{fileExtension}</span>
                                        )}
                                        {fileExtension && (numberOfPages || sizeInBytes) && ' • '}
                                        {numberOfPages && (
                                            <span>
                                                {numberOfPages} page{numberOfPages === 1 ? '' : 's'}
                                            </span>
                                        )}
                                        {numberOfPages && sizeInBytes && ' • '}
                                        {sizeInBytes && <span>{prettyBytes(sizeInBytes)}</span>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MediaAttachmentsBox;
