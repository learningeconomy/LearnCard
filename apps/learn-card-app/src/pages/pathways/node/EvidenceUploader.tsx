/**
 * EvidenceUploader — collapsed pill that expands into a single-field
 * form on tap.
 *
 * Design changes vs. the Phase 1 version:
 *
 *   - Dropped the Type selector. Artifact type is inferred: a URL
 *     becomes a `link`, everything else becomes the termination's
 *     requested type (defaulting to `text`). Most learners type a
 *     note; the minority who paste a link are handled for free.
 *   - Default state is a calm pill, not an always-on form. The
 *     overlay feels less like a bureaucratic intake surface and more
 *     like a "drop your proof" inbox.
 *   - Placeholder and CTA copy adapt to the requested artifact type
 *     ("Drop a link", "Describe your image", etc.) so the learner
 *     always sees language that matches what the node actually asks
 *     for.
 */

import React, { useEffect, useRef, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { addOutline, attachOutline } from 'ionicons/icons';
import { AnimatePresence, motion } from 'motion/react';
import { v4 as uuid } from 'uuid';

import type { ArtifactType, Evidence } from '../types';

interface EvidenceUploaderProps {
    onSubmit: (evidence: Evidence) => void;
    /**
     * The artifact type the node's termination asks for. Drives the
     * default type, the placeholder copy, and the pill label so the
     * surface never contradicts the node's own rule.
     */
    expectedType?: ArtifactType;
    disabled?: boolean;
}

const URL_PATTERN = /^https?:\/\/\S+$/i;

const inferArtifactType = (
    text: string,
    expected: ArtifactType,
): ArtifactType => {
    if (URL_PATTERN.test(text.trim())) return 'link';

    return expected;
};

interface CopyFor {
    pillLabel: string;
    placeholder: string;
    hint: string;
    cta: string;
}

const COPY_BY_TYPE: Partial<Record<ArtifactType, CopyFor>> = {
    text: {
        pillLabel: 'Attach a note',
        placeholder: 'A sentence about what you did. Paste a link and it becomes a link.',
        hint: 'Short is fine.',
        cta: 'Attach note',
    },
    link: {
        pillLabel: 'Attach a link',
        placeholder: 'https://…',
        hint: 'Paste the URL to the work.',
        cta: 'Attach link',
    },
    image: {
        pillLabel: 'Describe your image',
        placeholder: 'One line about the image — upload lands in a later release.',
        hint: 'File uploads land in a later release; a one-line description counts for now.',
        cta: 'Attach description',
    },
    video: {
        pillLabel: 'Describe your video',
        placeholder: 'One line about the video — upload lands in a later release.',
        hint: 'File uploads land in a later release; a one-line description counts for now.',
        cta: 'Attach description',
    },
    audio: {
        pillLabel: 'Describe your audio clip',
        placeholder: 'One line about the recording.',
        hint: 'File uploads land in a later release.',
        cta: 'Attach description',
    },
    pdf: {
        pillLabel: 'Describe your PDF',
        placeholder: 'One line about the PDF — upload lands in a later release.',
        hint: 'File uploads land in a later release; a one-line description counts for now.',
        cta: 'Attach description',
    },
    code: {
        pillLabel: 'Share a code snippet',
        placeholder: 'Paste a link to the commit / gist, or describe what you built.',
        hint: 'A link to the commit or gist works best.',
        cta: 'Attach',
    },
    other: {
        pillLabel: 'Attach something',
        placeholder: 'A sentence about what you did.',
        hint: 'Anything that counts as evidence.',
        cta: 'Attach',
    },
};

const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
    onSubmit,
    expectedType = 'text',
    disabled,
}) => {
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const copy = COPY_BY_TYPE[expectedType] ?? COPY_BY_TYPE.text!;

    const canSubmit = note.trim().length > 0 && !disabled;

    // When the form opens, focus the textarea so the learner can type
    // without another tap. Small ergonomics beat that save lots of
    // micro-friction.
    useEffect(() => {
        if (open) textareaRef.current?.focus();
    }, [open]);

    const handleSubmit = () => {
        if (!canSubmit) return;

        const trimmed = note.trim();

        const evidence: Evidence = {
            id: uuid(),
            artifactType: inferArtifactType(trimmed, expectedType),
            note: trimmed,
            submittedAt: new Date().toISOString(),
        };

        setNote('');
        setOpen(false);
        onSubmit(evidence);
    };

    return (
        <div className="relative">
            <AnimatePresence mode="wait" initial={false}>
                {open ? (
                    <motion.section
                        key="form"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="p-4 rounded-2xl border border-grayscale-200 bg-white space-y-3"
                    >
                        <textarea
                            ref={textareaRef}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder={copy.placeholder}
                            rows={3}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900
                                       placeholder:text-grayscale-400 bg-white
                                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                                       resize-none font-poppins"
                            maxLength={500}
                        />

                        <p className="text-[11px] text-grayscale-400">{copy.hint}</p>

                        <div className="flex gap-2">
                            <motion.button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="flex-1 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white
                                           font-medium text-sm hover:bg-grayscale-800 transition-colors
                                           disabled:opacity-40 disabled:cursor-not-allowed
                                           flex items-center justify-center gap-2"
                            >
                                <IonIcon icon={attachOutline} className="text-base" aria-hidden />
                                <span>{copy.cta}</span>
                            </motion.button>

                            <button
                                type="button"
                                onClick={() => {
                                    setNote('');
                                    setOpen(false);
                                }}
                                className="py-3 px-4 rounded-[20px] border border-grayscale-300
                                           text-grayscale-700 font-medium text-sm
                                           hover:bg-grayscale-10 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.section>
                ) : (
                    <motion.button
                        key="pill"
                        type="button"
                        onClick={() => setOpen(true)}
                        disabled={disabled}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="w-full py-3.5 px-4 rounded-2xl border border-dashed border-grayscale-300
                                   bg-white/60 hover:bg-white hover:border-emerald-300
                                   text-sm font-medium text-grayscale-700
                                   transition-colors flex items-center justify-center gap-2
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <IonIcon
                            icon={addOutline}
                            className="text-base text-emerald-600"
                            aria-hidden
                        />
                        <span>{copy.pillLabel}</span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EvidenceUploader;
