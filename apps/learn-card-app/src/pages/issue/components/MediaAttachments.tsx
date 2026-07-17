import React, { useCallback, useState } from 'react';
import { Camera, FileText, Video, Link2, Loader2, X, Plus, ImageIcon } from 'lucide-react';

import { useImageUpload } from 'learn-card-base';

export type SimpleMediaType = 'photo' | 'document' | 'video' | 'link';

export interface SimpleMediaAttachment {
    id: string;
    type: SimpleMediaType;
    url: string;
    title: string;
    fileName?: string;
    fileType?: string;
}

interface MediaAttachmentsProps {
    attachments: SimpleMediaAttachment[];
    onChange: (attachments: SimpleMediaAttachment[]) => void;
    bare?: boolean;
}

const CARD_CLASS = 'bg-white border border-grayscale-200 rounded-[20px] p-5';
const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';

const TYPE_META: Record<
    SimpleMediaType,
    { label: string; Icon: React.FC<{ className?: string }>; fileType?: string }
> = {
    photo: { label: 'Photo', Icon: Camera, fileType: 'image/*' },
    document: { label: 'Document', Icon: FileText, fileType: 'application/pdf,.doc,.docx,.txt' },
    video: { label: 'Video', Icon: Video, fileType: 'video/*' },
    link: { label: 'Link', Icon: Link2 },
};

const makeId = () => `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const UploadButton: React.FC<{
    type: Exclude<SimpleMediaType, 'link'>;
    onUploaded: (attachment: SimpleMediaAttachment) => void;
}> = ({ type, onUploaded }) => {
    const meta = TYPE_META[type];
    const { handleFileSelect, isLoading } = useImageUpload({
        fileType: meta.fileType,
        resizeBeforeUploading: type === 'photo',
        onUpload: (url, file) =>
            onUploaded({
                id: makeId(),
                type,
                url,
                title: file?.name ?? meta.label,
                fileName: file?.name,
                fileType: file?.type,
            }),
    });

    return (
        <button
            type="button"
            onClick={handleFileSelect}
            disabled={isLoading}
            className="flex items-center gap-2 py-2.5 px-3 rounded-full border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40"
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <meta.Icon className="w-4 h-4" />
            )}
            {meta.label}
        </button>
    );
};

const AttachmentPreview: React.FC<{
    attachment: SimpleMediaAttachment;
    onRemove: () => void;
}> = ({ attachment, onRemove }) => {
    const { Icon } = TYPE_META[attachment.type];

    return (
        <div className="relative flex items-center gap-3 p-3 rounded-2xl border border-grayscale-200 bg-grayscale-10 animate-fade-in-up">
            <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-grayscale-100 flex items-center justify-center">
                {attachment.type === 'photo' ? (
                    <img
                        src={attachment.url}
                        alt={attachment.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Icon className="w-5 h-5 text-grayscale-500" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-grayscale-900 truncate">
                    {attachment.title}
                </p>
                <p className="text-xs text-grayscale-400 truncate">{attachment.url}</p>
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-grayscale-400 hover:text-grayscale-900 hover:bg-grayscale-100 transition-colors"
                aria-label="Remove attachment"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const MediaAttachments: React.FC<MediaAttachmentsProps> = ({
    attachments,
    onChange,
    bare = false,
}) => {
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');

    const addAttachment = useCallback(
        (attachment: SimpleMediaAttachment) => {
            onChange([...attachments, attachment]);
        },
        [attachments, onChange]
    );

    const removeAttachment = useCallback(
        (id: string) => {
            onChange(attachments.filter(a => a.id !== id));
        },
        [attachments, onChange]
    );

    const linkValid = /^https?:\/\/.+/i.test(linkUrl.trim());

    const addLink = useCallback(() => {
        const url = linkUrl.trim();
        if (!/^https?:\/\/.+/i.test(url)) return;
        addAttachment({
            id: makeId(),
            type: 'link',
            url,
            title: linkTitle.trim() || url,
        });
        setLinkUrl('');
        setLinkTitle('');
    }, [linkUrl, linkTitle, addAttachment]);

    const body = (
        <>
            <div className="flex flex-wrap gap-2">
                <UploadButton type="photo" onUploaded={addAttachment} />
                <UploadButton type="document" onUploaded={addAttachment} />
                <UploadButton type="video" onUploaded={addAttachment} />
            </div>

            <div className="space-y-2">
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        placeholder="https://example.com/proof"
                        className={INPUT_CLASS}
                    />
                    <button
                        type="button"
                        onClick={addLink}
                        disabled={!linkValid}
                        className="shrink-0 px-4 rounded-xl bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        Link
                    </button>
                </div>
                {linkUrl && linkValid && (
                    <input
                        type="text"
                        value={linkTitle}
                        onChange={e => setLinkTitle(e.target.value)}
                        placeholder="Link title (optional)"
                        className={INPUT_CLASS}
                    />
                )}
            </div>

            {attachments.length > 0 ? (
                <div className="space-y-2 pt-1">
                    {attachments.map(attachment => (
                        <AttachmentPreview
                            key={attachment.id}
                            attachment={attachment}
                            onRemove={() => removeAttachment(attachment.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2 text-xs text-grayscale-400">
                    <ImageIcon className="w-4 h-4" />
                    No attachments yet.
                </div>
            )}
        </>
    );

    if (bare) return <div className="space-y-4">{body}</div>;

    return (
        <section className={`${CARD_CLASS} space-y-4`}>
            <div>
                <h3 className="text-base font-semibold text-grayscale-900">Evidence & media</h3>
                <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                    Attach proof — photos, documents, videos, or links.
                </p>
            </div>
            {body}
        </section>
    );
};
