/**
 * EvidencePanel — compact chip-list of artifacts attached to a node.
 *
 * Phase 2 rewrite: no section label, no heavy cards. Each artifact
 * reads as a single-line chip — type dot + note preview + relative
 * time — so a learner can scan "yes, I've got three notes in" without
 * reading a log. Links render as anchors; text is truncated to a
 * single line so a long note doesn't stretch the overlay.
 */

import React from 'react';

import { motion } from 'motion/react';

import type { ArtifactType, Evidence } from '../types';

interface EvidencePanelProps {
    evidence: readonly Evidence[];
}

// One dot color per type keeps the palette to emerald-ish greens for
// "concrete proof" (text, link, code) and amber-ish warmths for
// descriptions of things we can't store yet (image/video/audio/pdf).
// Stays inside the app's documented color rules.
const TYPE_DOT: Record<ArtifactType, string> = {
    text: 'bg-emerald-500',
    link: 'bg-emerald-600',
    code: 'bg-emerald-700',
    image: 'bg-amber-500',
    video: 'bg-amber-500',
    audio: 'bg-amber-500',
    pdf: 'bg-amber-500',
    other: 'bg-grayscale-400',
};

const formatTime = (iso: string): string => {
    const then = new Date(iso).getTime();
    const diffMs = Date.now() - then;
    const minutes = Math.floor(diffMs / 60_000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(iso).toLocaleDateString();
};

const URL_PATTERN = /^https?:\/\/\S+$/i;

const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence }) => {
    if (evidence.length === 0) return null;

    return (
        <ul className="space-y-1.5">
            {evidence.map((artifact, i) => {
                const isLink =
                    artifact.artifactType === 'link' ||
                    (artifact.note && URL_PATTERN.test(artifact.note.trim()));

                return (
                    <motion.li
                        key={artifact.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.25,
                            ease: 'easeOut',
                            // Stagger by 40ms so a burst of attached items
                            // cascade in rather than all appearing at once.
                            delay: Math.min(i * 0.04, 0.2),
                        }}
                        className="flex items-center gap-2.5 py-2 px-3 rounded-xl
                                   bg-white/80 border border-grayscale-200
                                   hover:border-grayscale-300 transition-colors"
                    >
                        <span
                            aria-hidden
                            className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                                TYPE_DOT[artifact.artifactType]
                            }`}
                        />

                        {isLink ? (
                            <a
                                href={artifact.note ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-w-0 text-sm text-emerald-700 hover:text-emerald-900
                                           truncate underline decoration-emerald-200 underline-offset-2"
                            >
                                {artifact.note}
                            </a>
                        ) : (
                            <span className="flex-1 min-w-0 text-sm text-grayscale-800 truncate">
                                {artifact.note || (
                                    <span className="italic text-grayscale-400">
                                        (no note)
                                    </span>
                                )}
                            </span>
                        )}

                        <span
                            className="shrink-0 text-[11px] text-grayscale-400 tabular-nums"
                            title={new Date(artifact.submittedAt).toLocaleString()}
                        >
                            {formatTime(artifact.submittedAt)}
                        </span>
                    </motion.li>
                );
            })}
        </ul>
    );
};

export default EvidencePanel;
