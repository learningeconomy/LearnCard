import React, { useEffect, useState } from 'react';
import prettyBytes from 'pretty-bytes';

import Camera from 'learn-card-base/svgs/Camera';
import LinkIcon from 'apps/learn-card-app/src/components/svgs/LinkIcon';
import VideoIcon from 'apps/learn-card-app/src/components/svgs/VideoIcon';
import GenericDocumentIcon from 'apps/learn-card-app/src/components/svgs/GenericDocumentIcon';

import { getMediaBaseUrl } from 'learn-card-base/helpers/urlHelpers';
import { Lightbox, LightboxItem } from '@learncard/react';
import {
    getCoverImageUrl,
    isYoutubeUrl,
    getVideoMetadata as parseVideoMetadata,
} from 'learn-card-base';

import useTheme from '../../../../theme/hooks/useTheme';

type Attachment = {
    title: string;
    url: string;
    type: 'photo' | 'document' | 'video' | 'link' | 'text';
    description?: string;
    narrative?: string;
};

type Evidence = {
    id: string;
    type: ['Evidence'];
    name: string;
    description: string;
    narrative: string;
    genre: string;
    url: string;
};

type MediaMetadata = {
    fileExtension?: string;
    sizeInBytes?: number;
    numberOfPages?: number;
    type?: string;
    videoId?: string | null;
    embedUrl?: string | null;
    thumbnailUrl?: string | null;
};

type VideoMetadata = {
    title?: string;
    videoLength?: string;
    imageUrl?: string;
};

type MediaAttachmentsBoxProps = {
    attachments?: Attachment[];
    evidence?: Evidence[];
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
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
    evidence,
    getFileMetadata = defaultGetFileMetadata,
    getVideoMetadata = defaultGetVideoMetadata,
}) => {
    const [documentMetadata, setDocumentMetadata] = useState<{
        [documentUrl: string]: MediaMetadata | undefined;
    }>({});
    const [videoMetadata, setVideoMetadata] = useState<{
        [videoUrl: string]: VideoMetadata | undefined;
    }>({});
    const [parsedMetaData, setParsedMetaData] = useState<VideoMetadata | null>(null);

    const [evidenceAttachments, setEvidenceAttachments] = useState<Attachment[] | null>(null);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const getEvidenceAttachmentType = async (url: string) => {
        const videoMetadata = await getVideoMetadata(url);
        const docMetadata = await getFileMetadata(url);

        if (docMetadata && !videoMetadata) {
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(docMetadata.fileExtension)) {
                return 'photo';
            }
            if (['docx', 'doc', 'ppt', 'pptx', 'pdf'].includes(docMetadata.fileExtension)) {
                return 'document';
            }
        }
        if (videoMetadata && !docMetadata) {
            return 'video';
        }
        if (url.includes('data:application/pdf;base64,')) {
            return 'document';
        }
        return 'text';
    };

    useEffect(() => {
        const getEvidenceAttachments = async () => {
            if (!evidence) return;

            const result = await Promise.all(
                evidence.map(async ev => ({
                    title: ev.name,
                    url:
                        ev.url ??
                        (typeof ev.id === 'string' &&
                        ev.id.startsWith('data:application/pdf;base64,')
                            ? ev.id
                            : null),
                    description: ev.description,
                    narrative: ev.narrative ?? '',
                    type: ev.url
                        ? await getEvidenceAttachmentType(ev.url)
                        : await getEvidenceAttachmentType(ev.id),
                }))
            );

            setEvidenceAttachments(result);
        };

        getEvidenceAttachments();
    }, [evidence]);

    useEffect(() => {
        handleParseVideoMetadata();
    }, []);

    const handleParseVideoMetadata = async () => {
        if (mediaAttachments.length > 0) {
            const videoAttachment = mediaAttachments.find(a => a.type === 'video');
            if (videoAttachment) {
                const parsedVideoMetadata = await parseVideoMetadata(videoAttachment.url);
                setParsedMetaData(parsedVideoMetadata);
            }
        }
    };

    const allowedTypes = ['link', 'photo', 'video', 'document', 'text'] as const;
    const safeEvidenceAttachments = (evidenceAttachments ?? []).map(item => ({
        ...item,
        type: allowedTypes.includes(item.type as any) ? (item.type as Attachment['type']) : 'link',
    }));
    const combinedAttachments = [...attachments, ...safeEvidenceAttachments];

    const mediaAttachments: Attachment[] = [];
    const documentsAndLinks: Attachment[] = [];
    const textAttachments: Attachment[] = [];
    combinedAttachments.forEach(a => {
        switch (a.type) {
            case 'document':
            case 'link':
                documentsAndLinks.push(a);
                break;
            case 'photo':
            case 'video':
                mediaAttachments.push(a);
                break;
            case 'text':
                textAttachments.push(a);
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
                combinedAttachments.map(async attachment => {
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

        const videos = combinedAttachments.filter(a => a.type === 'video');
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
    };

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
            <h3 className="text-[17px] text-grayscale-900 font-poppins">Attachments</h3>
            {mediaAttachments.length > 0 && (
                <div className="flex gap-[5px] justify-between flex-wrap w-full">
                    <Lightbox
                        items={lightboxItems}
                        currentUrl={currentLightboxUrl}
                        setCurrentUrl={setCurrentLightboxUrl}
                    />
                    {mediaAttachments.map((media, index) => {
                        let innerContent: React.ReactNode;
                        let title = media.title;

                        if (media.type === 'video') {
                            const metadata = videoMetadata[media.url];
                            title = (title || metadata?.title) ?? '';
                            const baseUrl = getMediaBaseUrl(media.url);
                            const thumbnailUrl = parsedMetaData?.thumbnailUrl || metadata?.imageUrl;

                            innerContent = (
                                <div
                                    className="bg-cover bg-no-repeat bg-center relative font-poppins text-white text-[12px] font-[400] leading-[17px] flex flex-col justify-end items-start p-[10px] text-left bg-rose-600 rounded-[15px] h-full"
                                    style={{
                                        backgroundImage: thumbnailUrl
                                            ? `linear-gradient(180deg, rgba(0, 0, 0, 0) 44.20%, rgba(0, 0, 0, 0.6) 69%), url(${
                                                  thumbnailUrl ?? ''
                                              })`
                                            : undefined,
                                    }}
                                >
                                    {!thumbnailUrl && <VideoIcon size="60" className="m-auto" />}
                                    <div className="absolute bottom-[10px] left-[10px] z-10 flex items-center gap-[5px]">
                                        {thumbnailUrl && <VideoIcon />}
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
                                <div className="h-full w-full flex items-center justify-center">
                                    <img className="object-cover h-full w-full" src={media.url} />
                                    <Camera className="absolute bottom-[10px] left-[10px] z-10 w-[25px] text-white" />
                                </div>
                            );
                        }

                        const className = `media-attachment ${media.type} w-[49%] pt-[49%] overflow-hidden relative`;

                        return (
                            <button
                                key={index}
                                className="flex bg-grayscale-100 items-center rounded-[15px] w-full"
                                onClick={e => {
                                    e.stopPropagation();
                                    handleMediaAttachmentClick(media.url, media.type);
                                }}
                            >
                                <div className="relative h-[80px] w-[80px] rounded-[15px] overflow-hidden flex-shrink-0">
                                    {innerContent}
                                </div>
                                <div>
                                    {title && (
                                        <div className="text-[12px] text-grayscale-900 font-poppins px-[10px] line-clamp-3">
                                            {title}
                                        </div>
                                    )}
                                    {media?.description && (
                                        <span className="text-grayscale-900 text-[12px] px-[10px] line-clamp-3">
                                            {media.description ?? ''}
                                        </span>
                                    )}
                                </div>
                            </button>
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
                            baseUrl = getMediaBaseUrl(docOrLink.url);
                        }

                        const innerContent = (
                            <div className="flex flex-col gap-[5px]">
                                <div className="flex gap-[5px] items-center">
                                    {docOrLink.type === 'document' && (
                                        <GenericDocumentIcon className="shrink-0" />
                                    )}
                                    {docOrLink.type === 'link' && <LinkIcon className="shrink-0" />}

                                    <div className="flex flex-col w-full min-w-0">
                                        <span className="text-grayscale-900 font-[400]">
                                            {docOrLink.title ?? 'No title'}
                                        </span>
                                        <span className="text-grayscale-900 font-[400]">
                                            {docOrLink.description ?? ''}
                                        </span>
                                        <span className="text-grayscale-900 font-[400]">
                                            {docOrLink.narrative ?? ''}
                                        </span>
                                        {docOrLink.type === 'document' && metadata && (
                                            <div className="text-grayscale-700 font-[500] text-[12px] font-poppins">
                                                {fileExtension && (
                                                    <span className="uppercase">
                                                        {fileExtension}
                                                    </span>
                                                )}
                                                {fileExtension &&
                                                    (numberOfPages || sizeInBytes) &&
                                                    ' • '}
                                                {numberOfPages && (
                                                    <span>
                                                        {numberOfPages} page
                                                        {numberOfPages === 1 ? '' : 's'}
                                                    </span>
                                                )}
                                                {numberOfPages && sizeInBytes && ' • '}
                                                {sizeInBytes && (
                                                    <span>{prettyBytes(sizeInBytes)}</span>
                                                )}
                                            </div>
                                        )}
                                        {docOrLink.type === 'link' && (
                                            <div
                                                className={`text-${primaryColor} font-[500] text-[12px] font-poppins`}
                                            >
                                                {baseUrl}
                                            </div>
                                        )}
                                        {docOrLink.type === 'document' &&
                                            docOrLink.url.includes(
                                                'data:application/pdf;base64,'
                                            ) && (
                                                <a
                                                    href={docOrLink.url}
                                                    download={`${docOrLink.title}.pdf`}
                                                    className="text-grayscale-700 font-[500] text-[12px] font-poppins hover:underline"
                                                >
                                                    Download PDF
                                                </a>
                                            )}
                                    </div>
                                </div>
                            </div>
                        );

                        const className = `row-attachment ${docOrLink.type} bg-grayscale-100 rounded-[15px] p-[10px] w-full font-poppins text-[12px] leading-[18px] tracking-[-0.33px] text-left`;

                        return (
                            <a
                                key={index}
                                href={docOrLink.url}
                                target="_blank"
                                rel="noreferrer"
                                download={
                                    docOrLink.type === 'document' &&
                                    docOrLink.url.includes('data:application/pdf;base64,')
                                        ? `${docOrLink.title}.pdf`
                                        : undefined
                                }
                                className={className}
                                onClick={e => e.stopPropagation()}
                            >
                                {innerContent}
                            </a>
                        );
                    })}
                </div>
            )}
            {textAttachments &&
                textAttachments.map((text, index) => (
                    <div
                        key={index}
                        className="flex flex-col justify-start bg-grayscale-100 items-start rounded-[15px] w-full"
                    >
                        <span className="text-[12px] text-grayscale-900 font-poppins px-[10px] line-clamp-3">
                            {text.title ?? 'No title'}
                        </span>
                        <span className="text-[12px] text-grayscale-900 font-poppins px-[10px] line-clamp-3">
                            {text.description ?? ''}
                        </span>
                        <span className="text-[12px] text-grayscale-900 font-poppins px-[10px] line-clamp-3">
                            {text.narrative ?? ''}
                        </span>
                    </div>
                ))}
        </div>
    );
};

export default MediaAttachmentsBox;
