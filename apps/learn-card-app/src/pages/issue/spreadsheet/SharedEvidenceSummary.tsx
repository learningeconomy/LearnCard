import React from 'react';
import { IonIcon } from '@ionic/react';
import {
    peopleOutline,
    documentOutline,
    imageOutline,
    videocamOutline,
    linkOutline,
} from 'ionicons/icons';
import type { SimpleMediaAttachment, SimpleMediaType } from '../components/MediaAttachments';
import * as m from '../../../paraglide/messages.js';

const ICONS: Record<SimpleMediaType, string> = {
    photo: imageOutline,
    document: documentOutline,
    video: videocamOutline,
    link: linkOutline,
};

export const SharedEvidenceSummary: React.FC<{ attachments: SimpleMediaAttachment[] }> = ({
    attachments,
}) => (
    <section
        aria-label={m['issueFlow.sheet.reviewWorkspace.sharedEvidence']()}
        className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4 space-y-v3-3"
    >
        <div className="flex items-start gap-2.5">
            <IonIcon
                icon={peopleOutline}
                className="mt-0.5 shrink-0 text-lg text-emerald-700"
                aria-hidden="true"
            />
            <div>
                <h3 className="text-sm font-semibold text-grayscale-900">
                    {m['issueFlow.sheet.reviewWorkspace.sharedEvidence']()}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-grayscale-600">
                    {attachments.length
                        ? m['issueFlow.sheet.reviewWorkspace.sharedEvidenceHelp']()
                        : m['issueFlow.sheet.reviewWorkspace.noSharedEvidence']()}
                </p>
            </div>
        </div>
        {attachments.length > 0 && (
            <ul className="grid max-h-32 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
                {attachments.map(attachment => (
                    <li
                        key={attachment.id}
                        className="flex items-center gap-2 rounded-xl border border-grayscale-200 bg-white px-3 py-2"
                    >
                        <IonIcon
                            icon={ICONS[attachment.type] ?? linkOutline}
                            className="shrink-0 text-grayscale-600"
                            aria-hidden="true"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-grayscale-900">
                                {attachment.title || attachment.fileName || attachment.url}
                            </p>
                            <p
                                className="truncate text-xs text-grayscale-500"
                                title={attachment.url}
                            >
                                {attachment.url}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        )}
        <p className="text-xs leading-relaxed text-grayscale-600">
            {m['issueFlow.sheet.reviewWorkspace.personalEvidenceHelp']()}
        </p>
    </section>
);
