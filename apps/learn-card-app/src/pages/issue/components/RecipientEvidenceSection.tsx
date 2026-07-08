import React from 'react';
import { Paperclip } from 'lucide-react';

import { MediaAttachments, type SimpleMediaAttachment } from './MediaAttachments';
import { Recipient, recipientKey, recipientLabel } from './recipientTypes';

const CARD_CLASS = 'bg-white border border-grayscale-200 rounded-[20px] p-5';

interface RecipientEvidenceSectionProps {
    recipients: Recipient[];
    recipientEvidence: Record<string, SimpleMediaAttachment[]>;
    onChange: (recipientKey: string, attachments: SimpleMediaAttachment[]) => void;
}

export const RecipientEvidenceSection: React.FC<RecipientEvidenceSectionProps> = ({
    recipients,
    recipientEvidence,
    onChange,
}) => {
    if (recipients.length === 0) return null;

    return (
        <section className={`${CARD_CLASS} space-y-4 animate-fade-in-up`}>
            <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                </span>
                <div>
                    <h3 className="text-base font-semibold text-grayscale-900">
                        Evidence per recipient
                    </h3>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        Attach proof specific to each person. Optional.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {recipients.map(recipient => {
                    const key = recipientKey(recipient);
                    return (
                        <div
                            key={key}
                            className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4 space-y-4"
                        >
                            <p className="text-sm font-semibold text-grayscale-900">
                                {recipientLabel(recipient)}
                            </p>
                            <MediaAttachments
                                bare
                                attachments={recipientEvidence[key] ?? []}
                                onChange={next => onChange(key, next)}
                            />
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
