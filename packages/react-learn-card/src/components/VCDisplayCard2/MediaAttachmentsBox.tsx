import React, { useState, useEffect } from 'react';
import prettyBytes from 'pretty-bytes';

import Camera from '../svgs/Camera';
import GenericDocumentIcon from '../svgs/GenericDocumentIcon';

import { Attachment } from '../../types';

export type MediaMetadata = {
    fileExtension?: string;
    sizeInBytes?: number;
    numberOfPages?: number;
};

export type VideoMetadata = {
    title?: string;
    length?: string;
    source?: string; // e.g. "youtube.com"
    imageUrl?: string;
};

type MediaAttachmentsBoxProps = {
    attachments: Attachment[];
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string) => void;
};

const defaultGetFileMetadata = async (url: string) => {
    const isFilestack = url.includes('filestack');
    if (!isFilestack) return;

    const urlParams = url.split('.com/')[1]?.split('/');
    if (!urlParams) return;
    const handle = urlParams[urlParams.length - 1];

    let fetchFailed = false;
    const data = await fetch(`https://cdn.filestackcontent.com/${handle}/metadata`)
        .then(res => res.json())
        .catch(() => (fetchFailed = true));

    if (fetchFailed) return;

    const fileExtension = data.filename.split('.')[1];

    return {
        fileExtension,
        sizeInBytes: data.size,
        numberOfPages: undefined,
    };
};

const defaultGetVideoMetadata = async (url: string) => {
    const isYoutube = url.includes('youtube');
    if (!isYoutube) return;

    const metadataUrl = `http://youtube.com/oembed?url=${url}&format=json`;

    let fetchFailed = false;
    const metadata = await fetch(metadataUrl)
        .then(res => res.json())
        .catch(() => (fetchFailed = true));

    if (fetchFailed) return;

    return {
        title: metadata.title,
        imageUrl: metadata.thumbnail_url,
        length: '',
        source: 'youtube.com',
    };
};

// const youtubeMetadataGetter = require('youtube-metadata-from-url');
const MediaAttachmentsBox: React.FC<MediaAttachmentsBoxProps> = ({
    attachments,
    getFileMetadata = defaultGetFileMetadata,
    getVideoMetadata = defaultGetVideoMetadata,
    onMediaAttachmentClick,
}) => {
    const [fileMetadata, setFileMetadata] = useState<{
        [fileUrl: string]: MediaMetadata | VideoMetadata | undefined;
    }>({});
    const [videoMetadata, setVideoMetadata] = useState<{
        [fileUrl: string]: VideoMetadata | undefined;
    }>({});

    const mediaAttachments = attachments.filter(a => a.type === 'photo' || a.type === 'video');
    const files = attachments.filter(a => a.type === 'document');

    useEffect(() => {
        const getMetadata = async (attachments: Attachment[]): Promise<any> => {
            const fileMetadata: { [fileUrl: string]: MediaMetadata | undefined } = {};
            const videoMetadata: { [videoUrl: string]: VideoMetadata | undefined } = {};
            await Promise.all(
                attachments.map(async attachment => {
                    if (attachment.type === 'document') {
                        fileMetadata[attachment.url] = await getFileMetadata(attachment.url);
                    } else if (attachment.type === 'video') {
                        videoMetadata[attachment.url] = await getVideoMetadata(attachment.url);
                    }
                })
            );

            setVideoMetadata(videoMetadata);
            setFileMetadata(fileMetadata);
        };

        const videos = attachments.filter(a => a.type === 'video');
        getMetadata([...files, ...videos]);
    }, []);

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">Media Attachments</h3>
            {mediaAttachments.length > 0 && (
                <div className="flex gap-[5px] justify-between flex-wrap w-full">
                    {mediaAttachments.map((media, index) => {
                        let imageUrl;

                        if (media.type === 'video') {
                            imageUrl = videoMetadata[media.url]?.imageUrl;
                        } else {
                            imageUrl = media.url;
                        }

                        const innerContent = (
                            <>
                                <img
                                    className="absolute top-0 left-0 right-0 bottom-0"
                                    src={imageUrl}
                                />
                                <Camera className="absolute bottom-[10px] left-[10px] z-10" />
                            </>
                        );
                        const className =
                            'w-[49%] pt-[49%] rounded-[15px] overflow-hidden relative';

                        if (onMediaAttachmentClick) {
                            return (
                                <button
                                    key={index}
                                    className={className}
                                    onClick={() => onMediaAttachmentClick(media.url)}
                                >
                                    {innerContent}
                                </button>
                            );
                        }

                        return (
                            <div key={index} className={className}>
                                {innerContent}
                            </div>
                        );
                    })}
                </div>
            )}
            {files.length > 0 && (
                <div className="w-full flex flex-col gap-[5px]">
                    {files.map((f, index) => {
                        const metadata = fileMetadata[f.url];
                        const { fileExtension, sizeInBytes, numberOfPages } = metadata ?? {};

                        const innerContent = (
                            <>
                                <div className="flex gap-[5px] items-center">
                                    <GenericDocumentIcon className="shrink-0" />
                                    <span className="text-grayscale-900 font-[400]">
                                        {f.title ?? 'No title'}
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
                            </>
                        );

                        const className =
                            'bg-grayscale-100 rounded-[15px] p-[10px] w-full font-poppins text-[12px] leading-[18px] tracking-[-0.33px] text-left';

                        if (onMediaAttachmentClick) {
                            return (
                                <button
                                    key={index}
                                    className={className}
                                    onClick={() => onMediaAttachmentClick(f.url)}
                                >
                                    {innerContent}
                                </button>
                            );
                        }

                        return (
                            <div key={index} className={className}>
                                {innerContent}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MediaAttachmentsBox;
