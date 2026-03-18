import React, { useEffect, useState } from 'react';
import prettyBytes from 'pretty-bytes';

import Camera from 'learn-card-base/svgs/Camera';
import LinkIcon from 'apps/learn-card-app/src/components/svgs/LinkIcon';
import VideoIcon from 'apps/learn-card-app/src/components/svgs/VideoIcon';
import GenericDocumentIcon from 'apps/learn-card-app/src/components/svgs/GenericDocumentIcon';

import { getMediaBaseUrl } from 'learn-card-base/helpers/urlHelpers';
import { Lightbox, LightboxItem } from '@learncard/react';
import { getVideoMetadata as parseVideoMetadata } from 'learn-card-base';

import {
    getFileMetadata as getFileMetadataHelper,
    getVideoMetadata as getVideoMetadataHelper,
} from 'learn-card-base/helpers/attachment.helpers';
import {
    getEvidenceAttachmentType,
    isPdfAttachmentSource,
} from 'learn-card-base/helpers/credentialHelpers';
import {
    ResolvedDocumentResource,
    resolvePdfDocumentResource,
} from './helpers/pdfDocumentResource.helpers';

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
    type: ('Evidence' | 'EvidenceFile')[];
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

type ParsedVideoMetadata = Awaited<ReturnType<typeof parseVideoMetadata>>;

type MediaAttachmentsBoxProps = {
    attachments?: Attachment[];
    evidence?: Evidence[];
    getFileMetadata?: (url: string) => MediaMetadata;
    getVideoMetadata?: (url: string) => VideoMetadata;
};

const MediaAttachmentsBox: React.FC<MediaAttachmentsBoxProps> = ({
    attachments,
    evidence,
    getFileMetadata = getFileMetadataHelper,
    getVideoMetadata = getVideoMetadataHelper,
}) => {
    const [documentMetadata, setDocumentMetadata] = useState<{
        [documentUrl: string]: MediaMetadata | undefined;
    }>({});
    const [documentResources, setDocumentResources] = useState<{
        [documentUrl: string]: ResolvedDocumentResource | undefined;
    }>({});
    const [videoMetadata, setVideoMetadata] = useState<{
        [videoUrl: string]: VideoMetadata | undefined;
    }>({});
    const [parsedMetaData, setParsedMetaData] = useState<ParsedVideoMetadata | null>(null);

    const [evidenceAttachments, setEvidenceAttachments] = useState<Attachment[] | null>(null);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    useEffect(() => {
        const resolveEvidenceAttachments = async () => {
            if (!evidence) return;

            // Filter out CourseSyllabus and Textbook attachments as they are not attachments
            const _evidence = evidence.filter(ev => {
                if (ev.genre === 'CourseSyllabus' || ev.genre === 'Textbook') {
                    return false;
                }
                return true;
            });

            const result = await Promise.all(
                _evidence.map(async ev => {
                    let attachmentUrl = '';
                    let type: Attachment['type'] = 'link';

                    if (ev.url) {
                        type = await getEvidenceAttachmentType(ev.url);
                    } else if (typeof ev.id === 'string' && isPdfAttachmentSource(ev.id)) {
                        type = 'document';
                    } else if (ev?.type?.includes('EvidenceFile')) {
                        type = (ev.genre as Attachment['type']) ?? 'document';
                    } else {
                        type = await getEvidenceAttachmentType(ev.id);
                    }

                    if (ev.url) {
                        attachmentUrl = ev.url;
                    } else if (typeof ev.id === 'string' && isPdfAttachmentSource(ev.id)) {
                        attachmentUrl = ev.id;
                    } else if (typeof ev.id === 'string') {
                        attachmentUrl = ev.id;
                    }

                    return {
                        title: ev.name,
                        url: attachmentUrl,
                        description: ev.description,
                        narrative: ev.narrative ?? '',
                        type,
                    };
                })
            );

            setEvidenceAttachments(result);
        };

        resolveEvidenceAttachments();
    }, [evidence]);

    const allowedTypes = ['link', 'photo', 'video', 'document', 'text'] as const;
    const safeEvidenceAttachments = (evidenceAttachments ?? []).map(item => ({
        ...item,
        type: allowedTypes.includes(item.type as any) ? (item.type as Attachment['type']) : 'link',
    }));
    const combinedAttachments = [...(attachments ?? []), ...safeEvidenceAttachments];

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

    const firstVideoUrl = mediaAttachments.find(attachment => attachment.type === 'video')?.url;

    useEffect(() => {
        const handleParseVideoMetadata = async () => {
            if (!firstVideoUrl) {
                setParsedMetaData(null);
                return;
            }

            const parsedVideoMetadata = await parseVideoMetadata(firstVideoUrl);
            setParsedMetaData(parsedVideoMetadata);
        };

        handleParseVideoMetadata();
    }, [firstVideoUrl]);

    useEffect(() => {
        let shouldIgnore = false;
        const objectUrlsToRevoke: string[] = [];

        const getMetadata = async (): Promise<void> => {
            const docMetadata: { [docUrl: string]: MediaMetadata | undefined } = {};
            const resolvedDocuments: {
                [docUrl: string]: ResolvedDocumentResource | undefined;
            } = {};
            const videoMetadata: { [videoUrl: string]: VideoMetadata | undefined } = {};

            await Promise.all(
                combinedAttachments.map(async attachment => {
                    if (attachment.type === 'document') {
                        if (!attachment.url) return;

                        if (isPdfAttachmentSource(attachment.url)) {
                            const resolvedPdf = await resolvePdfDocumentResource(
                                attachment.url,
                                attachment.title
                            );

                            if (resolvedPdf) {
                                docMetadata[attachment.url] = resolvedPdf.metadata;
                                resolvedDocuments[attachment.url] = resolvedPdf.resource;
                                objectUrlsToRevoke.push(resolvedPdf.resource.previewUrl);
                                return;
                            }
                        }

                        docMetadata[attachment.url] = await getFileMetadata(attachment.url);
                        resolvedDocuments[attachment.url] = {
                            previewUrl: attachment.url,
                            downloadUrl: attachment.url,
                            isPdfDataSource: false,
                        };
                    } else if (attachment.type === 'video') {
                        videoMetadata[attachment.url] = await getVideoMetadata(attachment.url);
                    }
                })
            );

            if (shouldIgnore) {
                objectUrlsToRevoke.forEach(url => URL.revokeObjectURL(url));
                return;
            }

            setVideoMetadata(videoMetadata);
            setDocumentMetadata(docMetadata);
            setDocumentResources(resolvedDocuments);
        };

        getMetadata();

        return () => {
            shouldIgnore = true;
            objectUrlsToRevoke.forEach(url => URL.revokeObjectURL(url));
        };
    }, [attachments, evidenceAttachments, getFileMetadata, getVideoMetadata]);

    const [currentLightboxUrl, setCurrentLightboxUrl] = useState<string | undefined>(undefined);
    const lightboxItems = mediaAttachments.filter(
        a => a.type === 'photo' || a.type === 'video'
    ) as LightboxItem[];
    const handleMediaAttachmentClick = (url: string, type: Attachment['type']) => {
        if (type === 'photo' || type === 'video') {
            setCurrentLightboxUrl(url);
        }
    };

    if (combinedAttachments.length === 0) return null;

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
                                        <div className="text-left text-[12px] text-grayscale-900 font-poppins px-[10px] line-clamp-3">
                                            {title}
                                        </div>
                                    )}
                                    {media?.description && (
                                        <span className="text-left text-grayscale-900 text-[12px] px-[10px] line-clamp-3">
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
                        const documentResource =
                            docOrLink.type === 'document'
                                ? documentResources[docOrLink.url]
                                : undefined;
                        const metadata =
                            docOrLink.type === 'document'
                                ? documentMetadata[docOrLink.url]
                                : undefined;
                        const { fileExtension, sizeInBytes, numberOfPages } = metadata ?? {};
                        const previewUrl = documentResource?.previewUrl ?? docOrLink.url;

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
                                            documentResource?.isPdfDataSource && (
                                                <div className="flex items-center gap-[12px] pt-[4px]">
                                                    <a
                                                        href={previewUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-grayscale-700 font-[500] text-[12px] font-poppins hover:underline"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        Preview PDF
                                                    </a>
                                                    <a
                                                        href={documentResource.downloadUrl}
                                                        download={documentResource.downloadName}
                                                        className="text-grayscale-700 font-[500] text-[12px] font-poppins hover:underline"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        Download PDF
                                                    </a>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        );

                        const className = `row-attachment ${docOrLink.type} bg-grayscale-100 rounded-[15px] p-[10px] w-full font-poppins text-[12px] leading-[18px] tracking-[-0.33px] text-left`;

                        const shouldRenderPreviewActionsOnly =
                            docOrLink.type === 'document' && documentResource?.isPdfDataSource;

                        if (shouldRenderPreviewActionsOnly) {
                            return (
                                <div key={index} className={className}>
                                    {innerContent}
                                </div>
                            );
                        }

                        return (
                            <a
                                key={index}
                                href={previewUrl}
                                target="_blank"
                                rel="noreferrer"
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
