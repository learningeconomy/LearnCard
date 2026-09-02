import React, { useEffect, useState } from 'react';
import prettyBytes from 'pretty-bytes';

import { FlatIcon } from 'learn-card-base/components/FlatIcon';
import { CertificateDisplayIcon } from 'learn-card-base';
import Graduation from 'learn-card-base/svgs/Graduation';
import { StudiesIcon } from 'learn-card-base/svgs/wallet/StudiesIcon';
import DocumentIcon from 'learn-card-base/svgs/DocumentIcon';
import LinkIcon from '../../../../components/svgs/LinkIcon';
import { Image as ImageIcon } from 'lucide-react';
import { Lightbox, LightboxItem } from '@learncard/react';

import { getMediaBaseUrl } from 'learn-card-base/helpers/urlHelpers';

import {
    getAttachmentSource,
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
import { openAttachmentUrl } from '../../../../components/clr-transcript/clr.helpers';

type Attachment = {
    title: string;
    url: string;
    type: 'photo' | 'document' | 'video' | 'link' | 'text';
    description?: string;
    narrative?: string;
    sourceContext?: AttachmentSourceContext;
};

type AttachmentSourceContext = {
    kind: 'transcript' | 'course' | 'program';
    title: string;
    humanCode?: string;
    dateLabel?: string;
};

type Evidence = {
    id: string;
    type: ('Evidence' | 'EvidenceFile')[];
    name: string;
    description: string;
    narrative: string;
    genre: string;
    url: string;
    sourceContext?: AttachmentSourceContext;
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

const normalizeAttachmentType = (value: string | undefined): Attachment['type'] | undefined => {
    const normalized = value?.toLowerCase();
    if (
        normalized === 'photo' ||
        normalized === 'video' ||
        normalized === 'document' ||
        normalized === 'link' ||
        normalized === 'text'
    ) {
        return normalized;
    }
    return undefined;
};

const getAttachmentDownloadName = (
    documentResource: ResolvedDocumentResource | undefined,
    title: string | undefined,
    metadata: MediaMetadata | undefined
): string => {
    if (documentResource?.downloadName) return documentResource.downloadName;

    const safeTitle = (title || 'attachment').replace(/[^\w.\-]/g, '_');
    const extension = metadata?.fileExtension;
    const alreadyHasExtension =
        extension && safeTitle.toLowerCase().endsWith(`.${extension.toLowerCase()}`);

    return extension && !alreadyHasExtension ? `${safeTitle}.${extension}` : safeTitle;
};

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

    const [evidenceAttachments, setEvidenceAttachments] = useState<Attachment[] | null>(null);
    const [currentLightboxUrl, setCurrentLightboxUrl] = useState<string | undefined>(undefined);

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

                    const genreType = normalizeAttachmentType(ev.genre);

                    if (ev?.type?.includes('EvidenceFile')) {
                        type = genreType ?? 'document';
                    } else if (genreType && genreType !== 'link') {
                        // Trust an explicit genre (e.g. Filestack URLs carry no file
                        // extension, so URL sniffing can't classify them). 'link' still
                        // goes through detection so e.g. YouTube URLs render as video.
                        type = genreType;
                    } else if (typeof ev.id === 'string' && isPdfAttachmentSource(ev.id)) {
                        type = 'document';
                    } else if (ev.url) {
                        type = await getEvidenceAttachmentType(ev.url);
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
                        sourceContext: ev.sourceContext,
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
    const normalizedAttachments = (attachments ?? []).map(attachment => ({
        ...attachment,
        url: getAttachmentSource(attachment) ?? '',
    }));
    const combinedAttachments = [...normalizedAttachments, ...safeEvidenceAttachments];
    const lightboxItems = combinedAttachments.filter(
        a => a.type === 'photo' || a.type === 'video'
    ) as LightboxItem[];

    useEffect(() => {
        let shouldIgnore = false;
        const revokeResourceUrls: Array<() => void> = [];

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
                                if (resolvedPdf.resource.revokeUrls) {
                                    revokeResourceUrls.push(resolvedPdf.resource.revokeUrls);
                                }
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
                revokeResourceUrls.forEach(revoke => revoke());
                return;
            }

            setVideoMetadata(videoMetadata);
            setDocumentMetadata(docMetadata);
            setDocumentResources(resolvedDocuments);
        };

        getMetadata();

        return () => {
            shouldIgnore = true;
            revokeResourceUrls.forEach(revoke => revoke());
        };
    }, [attachments, evidenceAttachments, getFileMetadata, getVideoMetadata]);

    if (combinedAttachments.length === 0) return null;

    return (
        <div className="w-full space-y-2">
            <Lightbox
                items={lightboxItems}
                currentUrl={currentLightboxUrl}
                setCurrentUrl={setCurrentLightboxUrl}
            />
            {combinedAttachments.map((attachment, index) => {
                const documentResource =
                    attachment.type === 'document' ? documentResources[attachment.url] : undefined;
                const metadata =
                    attachment.type === 'document' ? documentMetadata[attachment.url] : undefined;
                const videoMeta =
                    attachment.type === 'video' ? videoMetadata[attachment.url] : undefined;
                const previewUrl = documentResource?.previewUrl ?? attachment.url;
                const title =
                    attachment.title || videoMeta?.title || attachment.description || 'Evidence';
                const subtitle =
                    attachment.type === 'link'
                        ? getMediaBaseUrl(attachment.url)
                        : attachment.url?.split('/').filter(Boolean).pop() ?? '';
                const fileDetails = [
                    metadata?.fileExtension?.toUpperCase(),
                    metadata?.sizeInBytes ? prettyBytes(metadata.sizeInBytes) : undefined,
                ].filter(Boolean);
                const isPreviewableMedia =
                    attachment.type === 'photo' || attachment.type === 'video';

                const preview = (() => {
                    if (attachment.type === 'photo') {
                        return attachment.url ? (
                            <img
                                className="h-full w-full rounded-[14px] object-cover"
                                src={attachment.url}
                                alt={title}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-grayscale-100">
                                <ImageIcon className="h-8 w-8 text-grayscale-500" />
                            </div>
                        );
                    }

                    if (attachment.type === 'video') {
                        const thumbnailUrl = videoMeta?.imageUrl;

                        return (
                            <div
                                className="relative flex h-full w-full items-center justify-center rounded-[14px] bg-grayscale-900 bg-cover bg-center"
                                style={{
                                    backgroundImage: thumbnailUrl
                                        ? `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.45)), url(${thumbnailUrl})`
                                        : undefined,
                                }}
                            >
                                {videoMeta?.videoLength && (
                                    <span className="absolute bottom-1.5 right-1.5 rounded bg-grayscale-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                        {videoMeta.videoLength}
                                    </span>
                                )}
                            </div>
                        );
                    }

                    if (attachment.type === 'document') {
                        return (
                            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white">
                                <DocumentIcon className="h-[50px] w-[50px] text-grayscale-500" />
                            </div>
                        );
                    }

                    return (
                        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white">
                            <LinkIcon className="h-[40px] w-[40px] text-grayscale-500" />
                        </div>
                    );
                })();

                const content = (
                    <>
                        <div
                            className={`shrink-0 overflow-hidden rounded-[16px] border border-grayscale-200 bg-white  ${
                                attachment.type === 'photo' || attachment.type === 'video'
                                    ? `p-0 h-[75px] ${
                                          attachment.type === 'photo' ? 'w-[75px]' : 'w-[100px]'
                                      }`
                                    : 'p-1.5 h-[65px] w-[65px]'
                            } `}
                        >
                            {preview}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-medium text-grayscale-800">
                                {title}
                            </p>
                            {subtitle && (
                                <p className="truncate font-medium text-[13px] text-grayscale-600">
                                    {subtitle}
                                </p>
                            )}
                            <p className="truncate text-[13px] font-medium uppercase text-grayscale-600">
                                {attachment.type === 'photo' ? 'Image' : attachment.type}
                                {fileDetails.length > 0 && ` • ${fileDetails.join(' • ')}`}
                            </p>
                        </div>
                    </>
                );
                const className = `flex w-full items-center gap-2 rounded-[20px] border border-grayscale-200 bg-white text-left transition-colors hover:bg-grayscale-10 ${
                    attachment.sourceContext ? 'shadow-none' : 'shadow-box-bottom'
                } ${attachment.type === 'photo' || attachment.type === 'video' ? 'p-1' : 'p-2'}`;
                const canOpen = Boolean(previewUrl && attachment.type !== 'text');
                const wrapWithSourceHeader = (node: React.ReactNode) => {
                    if (!attachment.sourceContext) return node;

                    const headerIcon =
                        attachment.sourceContext.kind === 'course' ? (
                            <StudiesIcon className="w-4 h-4" />
                        ) : attachment.sourceContext.kind === 'program' ? (
                            <CertificateDisplayIcon className="w-4 h-4 !text-grayscale-500" />
                        ) : (
                            <Graduation className="w-4 h-4 text-grayscale-500" />
                        );

                    return (
                        <div className="w-full rounded-[28px] border border-grayscale-200 bg-white p-4 shadow-box-bottom space-y-3">
                            <div className="flex items-center gap-2 min-w-0 px-1">
                                {attachment.sourceContext.dateLabel && (
                                    <p className="shrink-0 text-[13px] text-grayscale-700">
                                        {attachment.sourceContext.dateLabel}
                                    </p>
                                )}
                                {attachment.sourceContext.dateLabel && (
                                    <span className="shrink-0 text-grayscale-700">•</span>
                                )}
                                <span className="shrink-0 text-grayscale-700">
                                    <FlatIcon>{headerIcon}</FlatIcon>
                                </span>
                                {attachment.sourceContext.humanCode && (
                                    <p className="shrink-0 text-[13px] font-semibold text-grayscale-700">
                                        {attachment.sourceContext.humanCode}
                                    </p>
                                )}
                                <p className="min-w-0 truncate text-[13px] text-grayscale-700">
                                    {attachment.sourceContext.title}
                                </p>
                            </div>
                            {node}
                        </div>
                    );
                };

                if (canOpen && isPreviewableMedia) {
                    return wrapWithSourceHeader(
                        <button
                            key={`${attachment.url}-${index}`}
                            type="button"
                            className={className}
                            onClick={e => {
                                e.stopPropagation();
                                setCurrentLightboxUrl(attachment.url);
                            }}
                        >
                            {content}
                        </button>
                    );
                }

                if (canOpen) {
                    const downloadName = getAttachmentDownloadName(
                        documentResource,
                        title,
                        metadata
                    );

                    return wrapWithSourceHeader(
                        <button
                            key={`${attachment.url}-${index}`}
                            type="button"
                            className={className}
                            onClick={async e => {
                                e.stopPropagation();
                                // Pass the original source (data URI or remote URL), not the
                                // blob previewUrl — blob URLs can't open in the native browser.
                                await openAttachmentUrl(attachment.url, downloadName);
                            }}
                        >
                            {content}
                        </button>
                    );
                }

                return wrapWithSourceHeader(
                    <div key={`${attachment.url}-${index}`} className={className}>
                        {content}
                    </div>
                );
            })}
        </div>
    );
};

export default MediaAttachmentsBox;
