import React, { useEffect, useState } from 'react';
import prettyBytes from 'pretty-bytes';

import Camera from '../svgs/Camera';
import LinkIcon from '../svgs/LinkIcon';
import VideoIcon from '../svgs/VideoIcon';
import GenericDocumentIcon from '../svgs/GenericDocumentIcon';

import { Attachment } from '../../types';
import { getBaseUrl } from '../../helpers/url.helpers';
import { Lightbox, LightboxItem } from '../Lightbox';

export type MediaMetadata = {
    fileExtension?: string;
    sizeInBytes?: number;
    numberOfPages?: number;
};

export type VideoMetadata = {
    title?: string;
    videoLength?: string;
    imageUrl?: string;
};

type MediaAttachmentsBoxProps = {
    attachments: Attachment[];
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
    onMediaAttachmentClick?: (url: string, type: 'photo' | 'document' | 'video' | 'link') => void;
    enableLightbox?: boolean;
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

// Function to determine if the URL is from YouTube
const isYoutubeUrl = (url: string) => {
    const youtubeUrl = new URL(url);
    return youtubeUrl.hostname === 'www.youtube.com';
};

// Function to get the YouTube video ID from the URL
const getYoutubeVideoId = (url: string) => {
    const regex = /(?:\?v=|\.com\/embed\/)([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : '';
};

// Function to get the cover image URL for YouTube videos
const getCoverImageUrl = (youtubeWatchUrl: string) => {
    if (!isYoutubeUrl(youtubeWatchUrl)) {
        return ''; // Return an empty string if the URL is not a YouTube URL
    }

    const videoId = getYoutubeVideoId(youtubeWatchUrl);
    // Construct and return the URL for the video's cover image
    // This URL fetches the highest resolution image available
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
};

const defaultGetVideoMetadata = async (url: string) => {
    const isYoutube = isYoutubeUrl(url);
    if (!isYoutube) return;

    const metadataUrl = `http://youtube.com/oembed?url=${url}&format=json`;

    let fetchFailed = false;
    const metadata = await fetch(metadataUrl)
        .then(res => res.json())
        .catch(() => (fetchFailed = true));

    const coverImageUrl = getCoverImageUrl(url);

    if (fetchFailed) return { imageUrl: coverImageUrl };

    return {
        title: metadata.title,
        imageUrl: coverImageUrl,
        videoLength: '', // TODO figure out how to get this
    };
};

const MediaAttachmentsBox: React.FC<MediaAttachmentsBoxProps> = ({
    attachments,
    getFileMetadata = defaultGetFileMetadata,
    getVideoMetadata = defaultGetVideoMetadata,
    onMediaAttachmentClick,
    enableLightbox = false,
}) => {
    const [documentMetadata, setDocumentMetadata] = useState<{
        [documentUrl: string]: MediaMetadata | undefined;
    }>({});
    const [videoMetadata, setVideoMetadata] = useState<{
        [videoUrl: string]: VideoMetadata | undefined;
    }>({});

    const mediaAttachments: Attachment[] = [];
    const documentsAndLinks: Attachment[] = [];
    attachments.forEach(a => {
        switch (a.type) {
            case 'document':
            case 'link':
                documentsAndLinks.push(a);
                break;
            case 'photo':
            case 'video':
                mediaAttachments.push(a);
                break;
            default:
                break;
        }
    });

    useEffect(() => {
        const getMetadata = async (attachments: Attachment[]): Promise<any> => {
            const docMetadata: { [docUrl: string]: MediaMetadata | undefined } = {};
            const videoMetadata: { [videoUrl: string]: VideoMetadata | undefined } = {};
            await Promise.all(
                attachments.map(async attachment => {
                    if (attachment.type === 'document') {
                        docMetadata[attachment.url] = await getFileMetadata(attachment.url);
                    } else if (attachment.type === 'video') {
                        videoMetadata[attachment.url] = await getVideoMetadata(attachment.url);
                    }
                })
            );

            setVideoMetadata(videoMetadata);
            setDocumentMetadata(docMetadata);
        };

        const videos = attachments.filter(a => a.type === 'video');
        getMetadata([...documentsAndLinks, ...videos]);
    }, []);

    const [currentLightboxUrl, setCurrentLightboxUrl] = useState<string | undefined>(undefined);
    const lightboxItems = mediaAttachments.filter(
        a => a.type === 'photo' || a.type === 'video'
    ) as LightboxItem[];
    const handleMediaAttachmentClick = (
        url: string,
        type: 'photo' | 'document' | 'video' | 'link'
    ) => {
        if (type === 'photo' || type === 'video') {
            setCurrentLightboxUrl(url);
        }

        onMediaAttachmentClick?.(url, type);
    };

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
            <h3 className="text-[17px] text-grayscale-900 font-poppins">Attachments</h3>
            {mediaAttachments.length > 0 && (
                <div className="flex gap-[5px] justify-between flex-wrap w-full">
                    {enableLightbox && (
                        <Lightbox
                            items={lightboxItems}
                            currentUrl={currentLightboxUrl}
                            setCurrentUrl={setCurrentLightboxUrl}
                        />
                    )}
                    {mediaAttachments.map((media, index) => {
                        let innerContent: React.ReactNode;
                        let title = media.title;

                        if (media.type === 'video') {
                            const metadata = videoMetadata[media.url];
                            title = (title || metadata?.title) ?? '';
                            const baseUrl = getBaseUrl(media.url);

                            innerContent = (
                                <div
                                    className="bg-cover bg-no-repeat bg-center relative font-poppins text-white text-[12px] font-[400] leading-[17px] flex flex-col justify-end items-start p-[10px] text-left bg-rose-600 rounded-[15px] h-full"
                                    style={{
                                        backgroundImage: metadata?.imageUrl
                                            ? `linear-gradient(180deg, rgba(0, 0, 0, 0) 44.20%, rgba(0, 0, 0, 0.6) 69%), url(${metadata?.imageUrl ?? ''
                                            })`
                                            : undefined,
                                    }}
                                >
                                    {!metadata?.imageUrl && (
                                        <VideoIcon size="60" className="m-auto" />
                                    )}
                                    <div className="absolute bottom-[10px] left-[10px] z-10 flex items-center gap-[5px]">
                                        {metadata?.imageUrl && <VideoIcon />}
                                        {metadata?.videoLength && (
                                            <span className="leading-[23px]">
                                                {metadata.videoLength}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        } else {
                            innerContent = (
                                <div className="h-full w-full">
                                    <img className="rounded-[15px]" src={media.url} />
                                    <Camera className="relative bottom-[30px] left-[10px] z-10" />
                                </div>
                            );
                        }

                        const className = `media-attachment ${media.type} w-[49%] pt-[49%] overflow-hidden relative`;

                        if (onMediaAttachmentClick || enableLightbox) {
                            return (
                                <div
                                    key={index}
                                    className="flex bg-grayscale-100 items-center rounded-[15px] w-full"
                                >
                                    <button
                                        className="h-[80px] w-[80px] rounded-[15px]"
                                        onClick={() =>
                                            handleMediaAttachmentClick(media.url, media.type)
                                        }
                                    >
                                        {innerContent}
                                    </button>
                                    {title && (
                                        <div className="text-[12px] text-grayscale-900 font-poppins px-[10px] line-clamp-3">
                                            {title}
                                        </div>
                                    )}
                                </div>
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
            {documentsAndLinks.length > 0 && (
                <div className="w-full flex flex-col gap-[5px]">
                    {documentsAndLinks.map((docOrLink, index) => {
                        const metadata =
                            docOrLink.type === 'document'
                                ? documentMetadata[docOrLink.url]
                                : undefined;
                        const { fileExtension, sizeInBytes, numberOfPages } = metadata ?? {};

                        let baseUrl = '';
                        if (docOrLink.type === 'link') {
                            baseUrl = getBaseUrl(docOrLink.url);
                        }

                        const innerContent = (
                            <div className="flex flex-col gap-[5px]">
                                <div className="flex gap-[5px] items-center">
                                    {docOrLink.type === 'document' && (
                                        <GenericDocumentIcon className="shrink-0" />
                                    )}
                                    {docOrLink.type === 'link' && <LinkIcon className="shrink-0" />}
                                    <span className="text-grayscale-900 font-[400]">
                                        {docOrLink.title ?? 'No title'}
                                    </span>
                                </div>
                                {docOrLink.type === 'document' && metadata && (
                                    <a
                                        href={docOrLink.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-grayscale-600 font-[600] px-[5px] hover:underline"
                                    >
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
                                    </a>
                                )}
                                {docOrLink.type === 'link' && (
                                    <a
                                        href={docOrLink.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-indigo-500 font-[600] px-[5px] hover:underline"
                                    >
                                        {baseUrl}
                                    </a>
                                )}
                            </div>
                        );

                        const className = `row-attachment ${docOrLink.type} bg-grayscale-100 rounded-[15px] p-[10px] w-full font-poppins text-[12px] leading-[18px] tracking-[-0.33px] text-left`;

                        if (onMediaAttachmentClick) {
                            return (
                                <button
                                    key={index}
                                    className={className}
                                    onClick={() =>
                                        handleMediaAttachmentClick(docOrLink.url, docOrLink.type)
                                    }
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
