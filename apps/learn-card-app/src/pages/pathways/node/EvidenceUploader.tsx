/**
 * EvidenceUploader — Phase 1 minimal.
 *
 * Accepts a note + artifact-type for now. File uploads and the full
 * "proof of effort" framing land in Phase 2 (docs § 5). Evidence is
 * written through the store (which handles offline-aware enqueue).
 */

import React, { useState } from 'react';

import { v4 as uuid } from 'uuid';

import type { ArtifactType, Evidence } from '../types';

const ARTIFACT_TYPES: readonly { value: ArtifactType; label: string }[] = [
    { value: 'text', label: 'Text / note' },
    { value: 'link', label: 'Link' },
    { value: 'image', label: 'Image (describe for now)' },
    { value: 'video', label: 'Video (describe for now)' },
    { value: 'other', label: 'Other' },
];

interface EvidenceUploaderProps {
    onSubmit: (evidence: Evidence) => void;
    disabled?: boolean;
}

const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ onSubmit, disabled }) => {
    const [artifactType, setArtifactType] = useState<ArtifactType>('text');
    const [note, setNote] = useState('');

    const canSubmit = note.trim().length > 0 && !disabled;

    const handleSubmit = () => {
        if (!canSubmit) return;

        const evidence: Evidence = {
            id: uuid(),
            artifactType,
            note: note.trim(),
            submittedAt: new Date().toISOString(),
        };

        setNote('');
        onSubmit(evidence);
    };

    return (
        <section className="p-4 rounded-2xl border border-grayscale-200 bg-white space-y-3">
            <div>
                <h3 className="text-sm font-semibold text-grayscale-900 mb-0.5">
                    Attach evidence
                </h3>

                <p className="text-xs text-grayscale-500">
                    A sentence about what you did counts. Short is fine.
                </p>
            </div>

            <div className="space-y-1.5">
                <label
                    htmlFor="evidence-type"
                    className="text-xs font-medium text-grayscale-700"
                >
                    Type
                </label>

                <select
                    id="evidence-type"
                    value={artifactType}
                    onChange={e => setArtifactType(e.target.value as ArtifactType)}
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900
                               bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                               font-poppins"
                >
                    {ARTIFACT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1.5">
                <label
                    htmlFor="evidence-note"
                    className="text-xs font-medium text-grayscale-700"
                >
                    Note
                </label>

                <textarea
                    id="evidence-note"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Wrote the scope paragraph; about 180 words."
                    rows={3}
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900
                               placeholder:text-grayscale-400 bg-white
                               focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                               resize-none font-poppins"
                    maxLength={500}
                />
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm
                           hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Attach
            </button>
        </section>
    );
};

export default EvidenceUploader;
